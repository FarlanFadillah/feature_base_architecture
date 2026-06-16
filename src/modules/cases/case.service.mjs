import * as mainRepo from "../../shared/repositories/main.repository.mjs";
import * as casesRepo from "./case.repository.mjs";
import * as logRepo from "../../shared/repositories/logs.repository.mjs";
import * as casesHelper from "./case.helper.mjs";
import * as jsonHelper from "../../shared/helper/json.helper.mjs";
import { ExpressError } from "../../shared/utils/custom.error.mjs";
import * as cache from "../../shared/utils/cache.mjs";
import db from "../../dbs/db.mjs";
import * as dshelper from "../../shared/utils/ds.mjs";
import roles from "../../configs/roles.config.mjs";
import * as bphtbService from "../../shared/services/bphtb.service.mjs";
import * as pphService from "../../shared/services/pph.service.mjs";
import * as trxService from "../../shared/services/transaction.service.mjs";
import * as aktaService from "../../shared/services/akta.service.mjs";
import configs from "../../configs/index.mjs";

// step handlers
const handlers = {
    validate: {
        bphtb: bphtbService.validateBPHTB,
        alashak: casesHelper.validateAlasHak,
        clients: casesHelper.validateClients,
        pph: pphService.validatePPH,
        akta: aktaService.validateAkta,
    },
    invalidate: {
        alashak: casesHelper.invalidateAlasHak,
        clients: casesHelper.invalidateClients,
        pph: pphService.invalidatePPH,
        bphtb: bphtbService.invalidateBPHB,
        akta: aktaService.invalidateAkta,
    },
};

/**
 *
 * @param {Object} data
 * @returns
 */
export async function create(data) {
    try {
        const id = await db.transaction(async (trx) => {
            // validate products
            const prd = await mainRepo.get(
                configs.TABLE.$CASES.PRD,
                data.prd_id,
                ["*"],
                trx,
            );
            if (!prd) throw new ExpressError("Products not available", 404);

            // insert case data
            const case_id = await casesRepo.createCase(data, trx);
            await casesRepo.lockForUpdate(case_id, trx);

            // insert step from workflow templates
            const step_id = await casesRepo.createSteps(
                case_id,
                data.prd_id,
                trx,
            );

            // update status current step
            await casesRepo.updateCase(
                case_id,
                { current_step: step_id, status: "IN PROGRESS" },
                trx,
            );
            await logRepo.insertLogs(
                case_id,
                "cases",
                `Case [${prd.name}] is created.`,
                "info",
                trx,
            );
            return case_id;
        });

        // DTO.clients.forEach((val) => {
        //     cache.delByPattern(`:clients:id:${val?.id}`);
        // });
        cache.delByPattern(":cases:list:");
        return id;
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @returns
 */
export async function nextStep(id) {
    try {
        // TODO
        /**
         * 1. Get current step id
         * 2. validate current step (current step, )
         * 3. if the current step is valid proceed to the next step, return error if not
         * 4. check if the next step is exists
         * 5. update case current step
         */

        const caseIsFinished = await db.transaction(async (trx) => {
            // Lock case for update and
            // get case by its id
            const [_case] = await casesRepo.lockForUpdate(id, trx);

            // validate case
            if (!_case) throw new ExpressError("Case not found", 404);
            else if (_case.status === "DONE")
                throw new ExpressError("Case already finished");

            // get current step
            const current_step = await casesRepo.getStep(
                _case.current_step,
                trx,
            );

            // check if current step is valid or don't have requirement
            if (
                !current_step.valid &&
                current_step.validation &&
                !current_step.can_skip
            )
                throw Error(
                    `Current step not finished yet [${current_step.name}]`,
                );

            const [finished, next_step_name] =
                await casesHelper.proceedToNextStep(
                    _case.id,
                    _case.current_step,
                    _case.ah_id,
                    trx,
                );

            await logRepo.insertLogs(
                id,
                "cases",
                `Case proceed to the next step [${next_step_name}].`,
                "info",
                trx,
            );

            // proceed transaction if case is finished
            // and its product is a transaction
            const prd = await casesRepo.getProduct(_case.prd_id, trx);
            if (finished && prd.is_transaction) {
                await trxService.transaction(
                    _case.id,
                    _case.ah_id,
                    prd.type_transaction,
                    trx,
                );
            }

            return finished;
        });

        cache.delByPattern(`:cases:id:${id}`);
        cache.delByPattern(`:cases:list:`);
        return caseIsFinished;
    } catch (error) {
        throw error;
    }
}

export async function prevStep(id) {
    try {
        await db.transaction(async (trx) => {
            const [_case] = await casesRepo.lockForUpdate(id, trx);

            // validate case
            if (!_case) throw new ExpressError("Case not found", 404);
            else if (_case.status === "DONE")
                throw new ExpressError("Case already finished");

            const result = await casesHelper.invalidateCurrentStep(
                _case.current_step,
                trx,
            );
            if (result) {
                const func = handlers.invalidate[result.handler];
                if (func) await func(id, result.invalidation, trx);
            }

            // set the current step to the previous step if exists
            const prev_name = await casesHelper.proceedToPreviousStep(
                _case.id,
                _case.current_step,
                trx,
            );

            await logRepo.insertLogs(
                id,
                "cases",
                `Case back to the previous step [${prev_name}].`,
                "info",
                trx,
            );
        });

        cache.delByPattern(`:cases:list:`);
        cache.delByPattern(`:cases:id:${id}`);
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} case_id
 * @param {Object} data
 * @param {import("knex").Knex.Transaction} trx
 */
export async function validateStep(case_id, data) {
    const { dto, handler, current_step_name } =
        await casesHelper.validateStepData(case_id, data);
    await db.transaction(async (trx) => {
        await handlers.validate[handler](case_id, dto, trx);
        await casesRepo.updateCurrentStep(
            case_id,
            {
                valid: true,
                completed_at: new Date(),
            },
            trx,
        );

        await logRepo.insertLogs(
            case_id,
            "cases",
            `[${current_step_name}] step is valid.`,
            "info",
            trx,
        );
    });
}

/**
 *
 * @param {Number} id
 * @param {Object} model
 */
export async function update(id, model) {
    try {
        await mainRepo.update("cases", id, model);

        cache.delByPattern(`:cases:id:${id}`);
        cache.delByPattern(":cases:list:");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 */
export async function remove(id) {
    try {
        await mainRepo.remove("cases", id);

        cache.delByPattern(`:cases:id:${id}`);
        cache.delByPattern(":cases:list:");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @returns
 */
export async function getCaseWithDetails(id) {
    try {
        const data = await casesRepo.getById(id);
        if (!data) throw new ExpressError("Data not found", 404);

        return data;
    } catch (error) {
        throw error;
    }
}

export async function getCaseData(id, trx) {
    return await mainRepo.get(configs.TABLE.CASES, id, "", trx);
}
/**
 *
 * @param {Number} currentpage
 * @param {Number} limit
 * @returns
 */
export async function getAll(currentpage, limit) {
    try {
        const offset = (currentpage - 1) * limit;
        const { cases, count } = await casesRepo.getAll(limit, offset);
        const _metadata = jsonHelper.paginationMetadata(
            "cases",
            currentpage,
            limit,
            count,
        );

        return { cases, _metadata };
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} currentpage
 * @param {Number} limit
 * @param {Object} filters
 * @returns
 */
export async function getFilteredCases(currentpage, limit, filters) {
    try {
        const offset = (currentpage - 1) * limit;

        if (filters.from) {
            filters.from = new Date(filters.from).toISOString();
        }

        if (filters.to) {
            const to = new Date(filters.to);
            to.setUTCHours(23, 59, 59);
            filters.to = to.toISOString();
        }

        const { cases, count } = await casesRepo.getFilteredCases(
            limit,
            offset,
            filters,
        );

        const _metadata = jsonHelper.paginationMetadata(
            "cases/search",
            currentpage,
            limit,
            count,
            [
                filters.code ? `code=${filters.code}` : "",
                filters.from ? `from=${filters.from}` : "",
                filters.to ? `to=${filters.to}` : "",
            ],
        );

        return { cases, _metadata };
    } catch (error) {
        throw error;
    }
}

export async function getRoles() {
    try {
        return await casesRepo.getRoles();
    } catch (error) {
        throw error;
    }
}
