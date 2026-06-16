import db from "../../dbs/db.mjs";
import { ExpressError } from "../../shared/utils/custom.error.mjs";

export async function get(id) {
    try {
        return await db("users").where({ id: id }).first();
    } catch (error) {
        throw ExpressError(error.message);
    }
}

export async function getUserByUsername(username) {
    try {
        const [[user]] = await db.raw(
            `SELECT * FROM users WHERE BINARY username = '${username}' LIMIT 1`,
        );
        return user;
    } catch (error) {
        throw new ExpressError(error.message);
    }
}
