import db from "../../dbs/db.mjs";
import { ExpressError } from "../../shared/utils/custom.error.mjs";
import createDebug from "debug";
import TABLE from "../../configs/table.config.mjs";
import * as rand from "../../shared/utils/randString.mjs";
import knex from "knex";
const debug = new createDebug("app:repo:cases");

// {
//   "case_num" : "001/PPAT-WK/III/2026",
//   "case_date" : "2026-03-01",
//   "status" : "DRAFT",
//   "prd_id" : 1,
//   "ah_id" : 3
// }

/**
 *
 * @param {Object} model
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function createCase(model, trx) {
    try {
        debug("creating case");
        const [id] = await trx(TABLE.CASES).insert({
            ...model,
            code: rand.genStringCaps(5, 5),
            created_at: new Date(),
            updated_at: new Date(),
        });

        return id;
    } catch (error) {
        throw new ExpressError(
            error.message,
            error.http_status || 400,
            error.code || "something broke",
        );
    }
}

/**
 *
 * @param {Number} case_id
 * @param {Number} prd_id
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function createSteps(case_id, prd_id, trx) {
    try {
        const conn = trx || db;
        debug("Get Workflows");
        const workflows = await conn(TABLE.WORKFLOWS).where({
            prd_id: prd_id,
        });

        const steps = workflows
            .sort((a, b) => a.order - b.order)
            .map((val, index) => ({
                case_id: case_id,
                step_id: val.id,
                name: val.name,
                status: index === 0 ? "IN PROGRESS" : "DRAFT",
                validation: val.validation,
                can_skip: val.can_skip,
            }));

        if (steps.length <= 0)
            throw new ExpressError(
                "The workflow for this product is not available.",
            );

        debug("Initiate steps");
        const [insertedID] = await conn(TABLE.$CASES.STEPS).insert(steps);

        return insertedID;
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {Number} id
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function getStep(id, trx) {
    try {
        const conn = trx || db;
        return await conn(`${TABLE.$CASES.STEPS} as cs`)
            .where("cs.id", id)
            .first();
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 * @param {Number} case_id
 * @param {Number} current_step_id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function getNextStep(case_id, current_step_id, trx) {
    try {
        const conn = trx || db;
        const current_step = await conn(TABLE.$CASES.STEPS)
            .where({
                id: current_step_id,
            })
            .first();
        if (!current_step)
            throw new ExpressError("Current step does not exists", 404);

        return await conn(TABLE.$CASES.STEPS)
            .where({ case_id: case_id })
            .andWhere("step_id", ">", current_step.step_id)
            .first();
    } catch (error) {
        throw new ExpressError(error.message, error.http_status || 400);
    }
}

/**
 * @param {Number} case_id
 * @param {Number} step_id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function getPrevStep(case_id, step_id, trx) {
    try {
        const conn = trx || db;
        const current_step = await conn(TABLE.$CASES.STEPS)
            .where({
                id: step_id,
            })
            .first();
        if (!current_step)
            throw new ExpressError("Current step does not exists", 404);
        return await conn(TABLE.$CASES.STEPS)
            .where({ case_id: case_id })
            .andWhere("step_id", "=", current_step.step_id - 1)
            .first();
    } catch (error) {
        throw new ExpressError(error.message, error.http_status || 400);
    }
}

/**
 * Link Clients to case
 * @param {Number} case_id
 * @param {Array} clients
 * @param {import("knex").Knex.Transaction} trx
 */
export async function linkClients(case_id, clients, trx) {
    const conn = trx || db;
    debug("create client case");
    const case_clients = clients.map((val) => ({
        case_id: case_id,
        client_id: val.id,
        role_id: val.role_id,
    }));
    await conn(TABLE.$CASES.CLIENTS).insert(case_clients);
}

/**
 *
 * @param {Number} case_id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function unlinkClients(case_id, trx) {
    const conn = trx || db;
    await conn(TABLE.$CASES.CLIENTS).where({ case_id: case_id }).forUpdate();
    await conn(TABLE.$CASES.CLIENTS).where({ case_id: case_id }).delete();
}

/**
 * Link alas hak to case
 * @param {Number} id
 * @param {Number} ah_id
 * @param {import("knex").Knex.Transaction}
 */
export async function linkAlasHak(id, ah_id, trx) {
    const conn = trx || db;
    await conn(TABLE.CASES).select("*").where({ id }).forUpdate();

    const alas_hak = await conn(TABLE.ALASHAK).where({ id: ah_id }).first();
    if (!alas_hak) throw new ExpressError("Alas Hak not found");

    await conn(TABLE.CASES).where({ id: id }).update({ ah_id: ah_id });
}

/**
 *
 * @param {Number} id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function unlinkAlasHak(id, trx) {
    const conn = trx || db;
    await conn(TABLE.CASES).where({ id: id }).forUpdate();
    await conn(TABLE.CASES).where({ id: id }).update({ ah_id: null });
}

/**
 *
 * @param {Number} id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function lockForUpdate(id, trx) {
    try {
        const conn = trx || db;
        return await conn(TABLE.CASES)
            .where({ id: id })
            .select("*")
            .forUpdate();
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {Number} id
 * @param {Object} data
 * @param {import("knex").Knex.Transaction} trx
 */
export async function updateCase(id, data, trx) {
    try {
        const conn = trx || db;
        await conn(TABLE.CASES)
            .where("id", id)
            .update({ ...data, updated_at: new Date() });
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {Number} id
 * @param {Object} data
 * @param {import("knex").Knex.Transaction} trx
 */
export async function updateStep(id, data, trx) {
    try {
        const conn = trx || db;
        await conn(TABLE.$CASES.STEPS)
            .where({ id: id })
            .forUpdate()
            .select("*");
        await conn(TABLE.$CASES.STEPS)
            .where({ id: id })
            .update({ ...data });
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {Number} case_id
 * @param {Object} data
 * @param {import("knex").Knex.Transaction} trx
 */
export async function updateCurrentStep(case_id, data, trx) {
    const conn = trx || db;
    const { current_step } = await conn(TABLE.CASES)
        .where({ id: case_id })
        .first();
    await conn(TABLE.$CASES.STEPS)
        .where({ id: current_step })
        .forUpdate()
        .select("*");
    await conn(TABLE.$CASES.STEPS)
        .where({ id: current_step })
        .update({ ...data });
}

/**
 * Get related client from case for bphtb
 * @param {Number} case_id
 * @param {Number} role_id
 * @param {knex.Knex.Transaction} trx
 * @returns {Promise<Array>}
 */
export async function getClientIdsFromCase(case_id, role_id, trx) {
    try {
        const conn = trx || db;
        return await conn(`${TABLE.CASES} as c`)
            .leftJoin(`${TABLE.$CASES.CLIENTS} as cc`, "cc.case_id", "c.id")
            .leftJoin(`${TABLE.CLIENTS} as cl`, "cl.id", "cc.client_id")
            .where("c.id", case_id)
            .andWhere("cc.role_id", role_id)
            .select("cl.id");
    } catch (error) {
        throw error;
    }
}

/**
 * Get related client from case for bphtb
 * @param {Number} case_id
 * @param {Number} role_id
 * @returns {Object}
 */
export async function getClientIdsFromCases(case_id) {
    try {
        return await db(`${TABLE.CASES} as c`)
            .leftJoin(`${TABLE.$CASES.CLIENTS} as cc`, "cc.case_id", "c.id")
            .leftJoin(`${TABLE.CLIENTS} as cl`, "cl.id", "cc.client_id")
            .where("c.id", case_id)
            .select("cl.id");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} ah_id
 * @param {Array} column
 * @returns
 */
export async function getAlasHakOwner(ah_id, column = ["*"]) {
    return await db(`${TABLE.CLIENTS} as cl`)
        .select(`cl.${column}`)
        .leftJoin(`${TABLE.$CLIENTS.ALASHAK} as ahc`, "ahc.client_id", "cl.id")
        .where("ahc.alas_hak_id", ah_id);
}

export async function getCaseById(id, trx) {
    try {
        const conn = trx || db;
        return await conn(TABLE.CASES).select("*").where({ id }).first();
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function getById(id, trx) {
    try {
        const conn = trx || db;
        const [[data]] = await conn.raw(`
            SELECT c.*,
            (SELECT JSON_OBJECT("id", ah.id, "no_alas_hak", ah.no_alas_hak) 
                FROM ${TABLE.ALASHAK} AS ah WHERE ah.id = c.ah_id
            ) AS alas_hak,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", cl.id, "fullname", cl.fullname, "role", cr.name))
                FROM ${TABLE.$CASES.CLIENTS} as cc LEFT JOIN ${TABLE.CLIENTS} AS cl on cl.id = cc.client_id 
                LEFT JOIN ${TABLE.$CLIENTS.ROLES} as cr on cr.id = cc.role_id
                WHERE cc.case_id = c.id
            ) AS clients,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", cs.id, "status", cs.status, "name", wf.name, "is_active",
                CASE
                    WHEN cs.id = c.current_step THEN 1
                    ELSE 0
                END,
                "valid", cs.valid,
                "validation", cs.validation
            )) FROM ${TABLE.$CASES.STEPS} as cs
                LEFT JOIN ${TABLE.WORKFLOWS} AS wf on wf.id = cs.step_id
                WHERE cs.case_id = c.id
            ) as case_steps,
            (SELECT JSON_ARRAYAGG(JSON_OBJECT("description", al.desc, "level", al.level, "timestamp", al.timestamp)) 
            FROM ${TABLE.$CASES.LOGS} as al
            WHERE al.entity_id = c.id AND al.entity_type = 'cases'
            ) as activities
            FROM ${TABLE.CASES} AS c WHERE c.id = ${id} LIMIT 1;
        `);

        return data;
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getFilteredCases(limit, offset, filters) {
    try {
        const cases = await db(`${TABLE.CASES} as c`)
            .select(["c.id", "c.code", "c.status", "prd.name as products"])
            .select(
                db.raw(
                    `JSON_OBJECT('id', ah.id, 'nomor', ah.no_alas_hak) as alas_hak`,
                ),
            )
            .leftJoin(`${TABLE.$CASES.PRD} as prd`, "prd.id", "c.prd_id")
            .leftJoin(`${TABLE.ALASHAK} as ah`, "ah.id", "c.ah_id")
            .where("c.code", "like", `${filters.code || ""}%`)
            .modify(function (queryBuilder) {
                if (filters.from) {
                    queryBuilder.andWhere(
                        "c.created_at",
                        ">=",
                        `${filters.from}`,
                    );
                }
                if (filters.to) {
                    queryBuilder.andWhere(
                        "c.created_at",
                        "<=",
                        `${filters.to}`,
                    );
                }
            })
            .limit(limit)
            .offset(offset);

        const [{ count }] = await db(`${TABLE.CASES} as c`)
            .where("c.code", "like", `${filters.code || ""}%`)
            .modify(function (queryBuilder) {
                if (filters.from) {
                    queryBuilder.andWhere(
                        "c.created_at",
                        ">=",
                        `${filters.from}`,
                    );
                }
                if (filters.to) {
                    queryBuilder.andWhere(
                        "c.created_at",
                        "<=",
                        `${filters.to}`,
                    );
                }
            })
            .count("id as count");
        return { cases, count };
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {Number} limit
 * @param {Number} offset
 * @returns
 */
export async function getAll(limit, offset) {
    try {
        const cases = await db(`${TABLE.CASES} as c`)
            .leftJoin(`${TABLE.$CASES.PRD} as prd`, "prd.id", "c.prd_id")
            .select(["c.id", "c.code", "c.status", "prd.name as products"])
            .limit(limit)
            .offset(offset);

        const [{ count }] = await db(TABLE.CASES).count("id as count");
        return { cases, count };
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {String} key
 * @param {String} value
 */
export async function searchBy(key, value, limit, offset) {
    try {
        const data = await db(`${TABLE.CASES} as c`)
            .leftJoin(`${TABLE.$CASES.PRD} as prd`, "prd.id", "c.prd_id")
            .where(`c.${key}`, "like", `%${value}%`)
            .select([
                "c.id",
                "c.case_num",
                "c.case_date",
                "prd.name as products",
            ])
            .limit(limit)
            .offset(offset);

        const [{ count }] = await db(TABLE.CASES)
            .where(key, "like", `%${value}%`)
            .count("* as count");

        return { data, count };
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {Number} limit
 * @param {Number} offset
 * @param {String} from
 * @param {String} to
 * @param {String} code
 * @returns
 */
export async function searchByDate(limit, offset, from, to, code) {
    try {
        const data = await db("cases")
            .whereBetween("created_at", [from, to])
            .select(["id", "code", "case_date"])
            .limit(limit)
            .offset(offset);

        const [{ count }] = await db("cases")
            .whereBetween("case_date", [from, to])
            .count("id as count");

        return { data, count };
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getRoles() {
    try {
        return await db("client_roles").select(["id", "name"]);
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {Number} id
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function getProduct(id, trx) {
    try {
        const conn = trx || db;
        return await conn(TABLE.$CASES.PRD).where({ id: id }).first();
    } catch (error) {
        throw error;
    }
}
