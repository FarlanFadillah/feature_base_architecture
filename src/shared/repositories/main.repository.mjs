import db from "../../dbs/db.mjs";
import { ExpressError, KnexError } from "../utils/custom.error.mjs";

/**
 *
 * @param {String} table
 * @param {Object} model
 */
export async function create(table, model) {
    try {
        const [id] = await db(table).insert(model);
        return id;
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
        // console.log(error);
        // if (error.code === "SQLITE_CONSTRAINT")
        //     throw new ExpressError("This data already exists", 409);
        // else if (error.code === "ER_DUP_ENTRY") {
        //     throw new ExpressError(
        //         "An entry with the provided data already exists",
        //         409,
        //     );
        // } else if (error.code === "ER_NO_REFERENCED_ROW_2") {
        //     console.log("DEBUG : ", error.constraint);
        //     throw new ExpressError(error.sqlMessage, 422, error.code);
        // }
        // throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {String} table
 * @param {Number} id
 */
export async function remove(table, id) {
    try {
        await db.transaction(async (trx) => {
            const [{ count }] = await trx(table)
                .where({ id: id })
                .count("id as count");
            if (count <= 0)
                throw new ExpressError(
                    "The resource you are trying to delete does not exist or has already been removed",
                    404,
                );
            await trx(table).where({ id: id }).delete();
        });
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
    }
}

export async function removeWhere(table, model) {
    try {
        await db.transaction(async (trx) => {
            const [{ count }] = await trx(table)
                .where(model)
                .count("* as count");
            if (count <= 0)
                throw new ExpressError(
                    "The resource you are trying to delete does not exist or has already been removed",
                    404,
                );
            await trx(table).where(model).delete();
        });
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
    }
}

/**
 *
 * @param {String} table
 * @param {Number} id
 * @param {Object} data
 * @param {import("knex").Knex.Transaction}
 */
export async function update(table, id, data, trx) {
    try {
        const conn = trx || db;
        await conn(table).where({ id: id }).forUpdate();
        await conn(table)
            .update({
                ...data,
                updated_at: new Date(),
            })
            .where({ id: id });
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
    }
}

export async function updateNoUpdatedAt(table, id, model) {
    try {
        await db.transaction(async (trx) => {
            await trx(table).where({ id: id }).forUpdate();
            await trx(table)
                .update({ ...model })
                .where({ id });
        });
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
    }
}

/**
 *
 * @param {String} table
 * @param {Object} model
 * @param {Object} data
 */
export async function updateWhere(table, model, data) {
    try {
        await db.transaction(async (trx) => {
            await trx(table).where(model).forUpdate();
            await trx(table).where(model).update(data);
        });
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
    }
}

/**
 *
 * @param {String} table
 * @param {Number} id
 * @param {import("knex").Knex.Transaction}
 * @returns
 */
export async function isExists(table, id, trx) {
    try {
        const conn = trx || db;
        const { count } = await conn(table)
            .where({ id })
            .count("id as count")
            .first();
        return count > 0;
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
    }
}

/**
 *
 * @param {String} table
 * @param {Object} model
 * @returns
 */
export async function isRowExists(table, model) {
    try {
        const { count } = await db(table)
            .where(model)
            .count("* as count")
            .first();
        return count > 0;
    } catch (error) {
        throw new KnexError(
            error.message,
            error.code,
            error.errno,
            error.sqlState,
            error.sqlMessage,
            error.sql,
        );
    }
}

/**
 *
 * @param {String} table
 * @param {Object} model
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function isExistsWhere(table, model, trx) {
    try {
        const conn = trx || db;
        const { count } = await conn(table)
            .where(model)
            .count("* as count")
            .first();
        return count > 0;
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

/**
 *
 * @param {String} table
 * @param {Number} id
 * @param {Array} select
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function get(table, id, select = ["*"], trx) {
    try {
        const conn = trx || db;
        return await conn(table).where({ id }).select(select).first();
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getBy(table, column_name, value) {
    try {
        return await db(table).where(column_name, value).first();
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getWhereLike(table, column, value) {
    try {
        return await db(table).where(column, "like", `%${value}%`);
    } catch (error) {
        throw new ExpressError(error.message);
    }
}
