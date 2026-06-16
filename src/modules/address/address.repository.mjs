import db from "../../dbs/db.mjs";
import { ExpressError, KnexError } from "../../shared/utils/custom.error.mjs";
import TABLE from "../../configs/table.config.mjs";

/**
 *
 * @param {"provinsi" | "kabupaten" | "kecamatan" | "kelurahan"} table
 * @param {String} name
 * @returns
 */
export async function get(table, name) {
    try {
        return await db(table)
            .where("name", "like", `%${name}%`)
            .select("id")
            .first();
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

export async function getKelurahan(name, limit, offset) {
    try {
        const addresses = await db(TABLE.$ADDRESS.KEL)
            .where("name", "like", `%${name}%`)
            .select("id", "name")
            .limit(limit)
            .offset(offset);
        return addresses;
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
export async function getKecamatan(name) {
    try {
        const code = await db(TABLE.$ADDRESS.KEC)
            .where("name", "like", `%${name}%`)
            .first();
        return code;
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getKabupaten(name) {
    try {
        const code = await db(TABLE.$ADDRESS.KAB)
            .where("name", "like", `%${name}%`)
            .first();
        return code;
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getProvinsi(name) {
    try {
        const code = await db(TABLE.$ADDRESS.PROV)
            .where("name", "like", `%${name}%`)
            .first();
        return code;
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getAllProvinsi() {
    try {
        return await db(TABLE.$ADDRESS.PROV);
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getAllKabupaten(id_provinsi) {
    try {
        return await db(TABLE.$ADDRESS.KAB).where({ id_provinsi: id_provinsi });
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getAllKecamatan(id_kabupaten) {
    try {
        return await db(TABLE.$ADDRESS.KEC).where({
            id_kabupaten: id_kabupaten,
        });
    } catch (error) {
        throw new ExpressError(error.message);
    }
}

export async function getAllKelurahan(id_kecamatan) {
    try {
        return await db(TABLE.$ADDRESS.KEL).where(
            "id_kecamatan",
            "=",
            id_kecamatan,
        );
    } catch (error) {
        throw new ExpressError(error.message);
    }
}
