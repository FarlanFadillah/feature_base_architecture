import * as casesRepo from "./case.repository.mjs";
import * as trxService from "../../shared/services/transaction.service.mjs";
import configs from "../../configs/index.mjs";
import { ExpressError } from "../../shared/utils/custom.error.mjs";
import * as mainRepo from "../../shared/repositories/main.repository.mjs";
import { config } from "dotenv";
import * as dsa from "../../shared/utils/ds.mjs";
import * as joiUtils from "../../shared/utils/joi.mjs";
import * as cache from "../../shared/utils/cache.mjs";

/**
 *
 * @param {Number} case_id
 * @param {Number} current_step
 * @param {import("knex").Knex.Transaction} trx
 */
export async function proceedToPreviousStep(case_id, current_step, trx) {
    // get the next step if exists
    const prev_step = await casesRepo.getPrevStep(case_id, current_step, trx);

    // check if next step is exists
    if (prev_step) {
        // current step is done
        await casesRepo.updateStep(
            current_step,
            { status: "DRAFT", valid: false, completed_at: new Date() },
            trx,
        );

        // update current step id
        await casesRepo.updateCase(
            case_id,
            { current_step: prev_step.id },
            trx,
        );

        // update new current step
        await casesRepo.updateStep(
            prev_step.id,
            { status: "IN PROGRESS" },
            trx,
        );
        return prev_step.name;
    } else {
        throw new ExpressError(
            "you're reaching the beginning of the workflows",
        );
    }
}

/**
 *
 * @param {Number} cs_id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function invalidateCurrentStep(cs_id, trx) {
    const current_step = await casesRepo.getStep(cs_id, trx);

    const { validation } = current_step;
    if (!validation) return null;
    if (!validation.invalidation) return null;

    return {
        handler: validation.handler,
        invalidation: validation.invalidation,
    };
}

/**
 *
 * @param {Number} case_id
 * @param {Number} current_step
 * @param {Number} ah_id
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function proceedToNextStep(case_id, current_step, ah_id, trx) {
    // get the next step if exists
    const next_step = await casesRepo.getNextStep(case_id, current_step, trx);

    // check if next step is exists
    if (next_step) {
        // current step is done
        await casesRepo.updateStep(
            current_step,
            { status: "DONE", valid: true, completed_at: trx.fn.now() },
            trx,
        );

        // update current step id
        await casesRepo.updateCase(
            case_id,
            { current_step: next_step.id },
            trx,
        );

        // update new current step
        await casesRepo.updateStep(
            next_step.id,
            { status: "IN PROGRESS" },
            trx,
        );

        return [false, next_step.name];
    } else {
        // if the code reach this if statement
        // its mean the case is done

        // update case, set status to done
        await casesRepo.updateCase(
            case_id,
            { status: "DONE", completed_at: new Date() },
            trx,
        );

        // update current step, set status to done
        await casesRepo.updateStep(
            current_step,
            { status: "DONE", completed_at: new Date() },
            trx,
        );

        return [true, null];
    }
}

/**
 *
 * @param {Number} case_id
 * @param {Object} data
 * @returns
 */
export async function validateStepData(case_id, data) {
    const _case = await casesRepo.getCaseById(case_id);
    // validate case
    if (!_case) throw new ExpressError("Case not found", 404);
    else if (_case.status === "DONE")
        throw new ExpressError("Case already finished");

    const { validation, valid, name } = await casesRepo.getStep(
        _case.current_step,
    );
    if (!validation)
        throw new ExpressError(
            "Current step does not have requirement, you can continue",
        );

    const { handler = null, fields = null } = validation;
    const schema = joiUtils.buildJoiSchema(fields);
    const { value: dto, error } = schema.validate(data, {
        stripUnknown: true,
    });

    if (error) {
        console.log(error);
        throw new Error(error);
    }

    return { dto, handler, current_step_name: name };
}

/**
 *
 * @param {Number} case_id
 * @param {Object} data
 * @param {import("knex").Knex.Transaction} trx
 */
export async function validateAlasHak(case_id, data, trx) {
    const { ah_id } = data;

    // validate alas hak
    const ah_exists = await mainRepo.isExists(
        configs.TABLE.ALASHAK,
        ah_id,
        trx,
    );
    if (!ah_exists) throw new ExpressError("Alas Hak not found", 404);

    // check if the Alas Hak case is still ongoing
    const ah_conflict = await casesRepo.alasHakConflict(case_id, ah_id, trx);
    if (ah_conflict) {
        throw new ExpressError(
            `Alas Hak masih terikat dengan case yang sedang berlangsung`,
            400,
        );
    }

    // check if alas hak is invalid
    const ah_invalid = await mainRepo.isExistsWhere(
        configs.TABLE.ALASHAK,
        {
            parent_id: ah_id,
        },
        trx,
    );
    if (ah_invalid) throw new ExpressError("Alas Hak already has been divided");

    await casesRepo.linkAlasHak(case_id, ah_id, trx);

    cache.delByPattern(`:alashak:id:${ah_id}:`);
    cache.delByPattern(":alashak:list:");
    cache.delByPattern(`:cases:id:${case_id}:`);
    cache.delByPattern(":cases:list:");
}

export async function validateClients(case_id, data, trx) {
    const { clients } = data;
    const { ah_id, prd_id } = await casesRepo.getCaseById(case_id, trx);

    // get valid clients
    const valid_clients = await filterClients(prd_id, ah_id, clients);

    await casesRepo.linkClients(case_id, valid_clients, trx);

    valid_clients.forEach((val) => {
        cache.delByPattern(`:clients:id:${val.id}:`);
    });
    cache.delByPattern(`:clients:list:`);
    cache.delByPattern(`:cases:id:${case_id}:`);
    cache.delByPattern(":cases:list:");
}

/**
 *
 * @param {Number} case_id
 * @param {Object} invalidation
 * @param {import("knex").Knex.Transaction} trx
 */
export async function invalidateAlasHak(case_id, invalidation, trx) {
    if (invalidation.strategy === "nullify") {
        await casesRepo.unlinkAlasHak(case_id, trx);
    }
}

/**
 *
 * @param {Number} case_id
 * @param {Object} invalidation
 * @param {import("knex").Knex.Transaction} trx
 */
export async function invalidateClients(case_id, invalidation, trx) {
    if (invalidation.strategy === "delete") {
        await casesRepo.unlinkClients(case_id, trx);
    }
}

// Local functions

/**
 * Validate and Filter clients
 * @param {Number} prd_id
 * @param {Number} ah_id
 * @param {Array} clients
 * @returns {Array}
 */
async function filterClients(prd_id, ah_id, clients) {
    // required configs
    const requiredRoles = configs.CASES[prd_id].roles.required;

    // check required roles
    const required = pickClients(prd_id, clients, "required");

    // get all required id that client sent
    const req_ids = dsa.mapingArrayObject(required, "id");
    const roles_ids = dsa.mapingArrayObject(required, "role_id");

    // check if all required is satisfied
    if (!dsa.matchElement(requiredRoles, roles_ids)) {
        const role_names = requiredRoles.map(
            (val) => dsa.getKeyByValue(configs.ROLES, val) + ":" + val,
        );

        throw new ExpressError(
            `The required role is not fulfilled. This case require (${role_names.join(", ")})`,
            400,
            "MISSING INPUT",
        );
    }

    // check optional roles
    const optional = pickClients(prd_id, clients, "optional");

    // Get owners
    const client_ids = await casesRepo.getAlasHakOwner(ah_id, ["id"]);

    // check if required client include the owner
    // transaction products only
    // it'll skip if not transaction
    const invalid_client = required.filter((val) =>
        dsa.mapingArrayObject(client_ids, "id").includes(val.id),
    );

    if (invalid_client.length > 0 && !!configs.CASES[prd_id].is_transaction) {
        const role = Object.keys(configs.ROLES).find(
            (k) => configs.ROLES[k] === invalid_client[0].role_id,
        );
        throw new ExpressError(`You can't set the owner as ${role}`);
    }

    // transform owner data for dbs insertion
    const owners = client_ids.reduce((acc, cur) => {
        if (cur.id)
            acc.push({
                id: cur.id,
                role_id: configs.CASES[prd_id].roles.auto,
            });
        return acc;
    }, []);

    // check if alas hak have an owner
    if (client_ids.length <= 0)
        throw ExpressError("Alas Hak does not have an owner", 404);

    // Return client and role data based on auto fields in product configuration.
    return [...owners, ...required];
}

/**
 *
 * @param {Number} case_id
 * @param {Number} role
 * @returns
 */
async function getClientsByRoleId(case_id, role) {
    const clients = await casesRepo.getClientIdsFromCase(case_id, role);
    if (!clients)
        throw new Error(
            `There is no ${configs.ROLES.PENERIMA_HAK} is link to the case`,
        );
    return clients;
}

/**
 * @param {Number} prd_id
 * @param {Array} clients
 * @param {"required" | "optional"} type
 * @return {Array}
 */
function pickClients(prd_id, clients, type) {
    if (!configs.CASES.hasOwnProperty.call(configs.CASES, prd_id))
        throw ExpressError("Product not found", 404);

    const required = clients.reduce((acc, cur) => {
        if (!cur.hasOwnProperty.call(cur, "role_id"))
            throw Error("role_id field not found");
        if (configs.CASES[prd_id].roles["auto"].includes(cur.role_id)) {
            const role = Object.keys(configs.ROLES).find(
                (k) => configs.ROLES[k] == cur.role_id,
            );
            throw new ExpressError(
                `${role} is automatically filled, do not submit the data`,
                400,
            );
        }

        if (configs.CASES[prd_id].roles[type].includes(cur.role_id))
            acc.push(cur);
        return acc;
    }, []);

    return required;
}
