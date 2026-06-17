import {
    ApiError,
    ExpressError,
    KnexError,
} from "../../shared/utils/custom.error.mjs";
import db from "../../dbs/db.mjs";
import TABLE from "../../configs/table.config.mjs";

// EXAMPLE
// {
//     "no_alas_hak" : "03040804102576",
//     "tgl_alas_hak" : "2020-12-20",
//     "no_surat_ukur" : "02525/Ampang Gadang/2020",
//     "tgl_surat_ukur" : "2020-10-05",
//     "luas" : 125,
//     "jor" : "Ampang Gadang",
//     "address_code" : "13.06.07.2005",
//     "type_id" : 1,
//      "ket" : "Proses Pemecahan"
// }

/**
 *
 * @param {Object} data
 * @param {import("knex").Knex.Transaction} trx
 */
export async function addAlasHak(data, trx) {
    try {
        const conn = trx || db;
        const [id] = await conn(TABLE.ALASHAK).insert(data);
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
    }
}

/**
 *
 * @param {Number} id
 * @param {number[]} clients
 * @param {import("knex").Knex.Transaction} trx
 */
export async function setOwner(id, clients, trx) {
    try {
        const conn = trx || db;
        const clientIds = clients.map((value) => value.id);
        const existing = await conn(TABLE.$ALASHAK.CLIENTS)
            .whereIn("client_id", clientIds)
            .andWhere("alas_hak_id", id);

        const existingIds = existing.map((value) => value.client_id);

        const payload = clientIds.filter(
            (value) => !existingIds.includes(value),
        );
        if (payload.length <= 0) return;
        await conn(TABLE.$ALASHAK.CLIENTS).insert(
            payload.map((value) => ({ client_id: value, alas_hak_id: id })),
        );
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
 * @param {Number} id
 * @param {Number} client_id
 * @param {import("knex").Knex} trx
 */
export async function removeOwner(id, client_id, trx) {
    try {
        const conn = trx || db;
        await conn(TABLE.$ALASHAK.CLIENTS)
            .where({ client_id: client_id })
            .delete();
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
 * @param {Object} data
 * @param {import("knex").Knex.Transaction}
 */
export async function saveDocument(data, trx) {
    try {
        const conn = trx || db;
        await conn(TABLE.$ALASHAK.DOCS).insert({
            ...data,
            uploaded_at: new Date(),
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
 * @param {Number} id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function lockDocsForUpdate(id, trx) {
    try {
        const conn = trx || db;
        return await conn(TABLE.$ALASHAK.DOCS)
            .where({ id: id })
            .forUpdate()
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

/**
 *
 * @param {Number} id
 * @param {Number} doc_id
 * @param {import("knex").Knex.Transaction} trx
 */
export async function deleteDocument(id, doc_id, trx) {
    try {
        const conn = trx || db;
        await conn(TABLE.$ALASHAK.DOCS)
            .where({ ah_id: id, id: doc_id })
            .delete();
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
 * @param {Number} id
 * @param {import("knex").Knex.Transaction} trx
 * @returns
 */
export async function getById(id, trx) {
    try {
        const conn = trx || db;
        return await conn(`${TABLE.ALASHAK} as ah`)
            .select(["ah.*"])
            .select(
                conn.raw(`
                    (SELECT COALESCE(JSON_ARRAYAGG(
                    JSON_OBJECT("id", cl.id, "nik", cl.nik, "fullname", cl.fullname, "gender", cl.gender)
                    ), JSON_ARRAY()) FROM ${TABLE.$ALASHAK.CLIENTS} AS ahc
                    LEFT JOIN ${TABLE.CLIENTS} AS cl ON ahc.client_id = cl.id
                    WHERE ahc.alas_hak_id = ah.id
                    ) as clients
                `),
            )
            .where({ id: id })
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

/**
 *
 * @param {Number} id
 * @returns
 */
export async function getWithDetails(id) {
    try {
        return await db(`${TABLE.ALASHAK} as ah`)
            .leftJoin(
                `${TABLE.$ADDRESS.KEL} as kel`,
                "kel.id",
                "ah.address_code",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.KEC} as kec`,
                "kec.id",
                "kel.id_kecamatan",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.KAB} as kab`,
                "kab.id",
                "kec.id_kabupaten",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.PROV} as prov`,
                "prov.id",
                "kab.id_provinsi",
            )
            .leftJoin(`${TABLE.$ALASHAK.TYPES} as tp`, "tp.id", "ah.type_id")
            .where("ah.id", id)
            .select([
                "ah.id",
                "ah.no_alas_hak",
                "ah.no_surat_ukur",
                "ah.tgl_alas_hak",
                "ah.luas",
                "ah.ket",
                "ah.created_at",
                "ah.updated_at",
                "tp.name as jenis_hak",
                "ah.type_id",
                "ah.address_code",
            ])
            .select(
                db.raw(`
                JSON_OBJECT("jorong", ah.jor, "kelurahan", kel.name, "kecamatan", kec.name, "kabupaten", kab.name, "provinsi", prov.name) AS address
                `),
            )
            .select(
                db.raw(`
                    (SELECT COALESCE(
                        JSON_ARRAYAGG(JSON_OBJECT("id", cl.id, "nik", cl.nik, 
                        "fullname", cl.fullname, "start_date", ahc.start_date)),
                        JSON_ARRAY()
                    ) as owners
                    FROM ${TABLE.$ALASHAK.CLIENTS} as ahc
                    LEFT JOIN ${TABLE.CLIENTS} as cl on cl.id = ahc.client_id
                    WHERE ahc.alas_hak_id = ah.id
                ) as owners
                `),
            )
            .select(
                db.raw(`
                    (
                    SELECT COALESCE(JSON_ARRAYAGG(t.obj), JSON_ARRAY())
                    FROM(
                        SELECT 
                            JSON_OBJECT("id", cl.id, "nik", cl.nik, "fullname", cl.fullname, 
                            "start_date", oh.start_date, "end_date", oh.end_date, "type", oh.acq_type, 
                            "case_id", oh.case_id) 
                        as obj
                        FROM ${TABLE.OWNERSHIPS} as oh
                        LEFT JOIN ${TABLE.CLIENTS} as cl on cl.id = oh.client_id
                        WHERE oh.ah_id = ah.id
                        ORDER BY oh.start_date DESC
                        LIMIT 18446744073709551615
                    ) as t
                ) as old_owners
                `),
            )
            .select(
                db.raw(`
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "type", prd.name, "status", c.status)), JSON_ARRAY()) FROM ${TABLE.CASES} AS c 
                LEFT JOIN ${TABLE.$CASES.PRD} AS prd ON prd.id = c.prd_id 
                WHERE c.ah_id = ah.id
                ) as cases
            `),
            )
            .select(
                db.raw(
                    `
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT("id", ahd.id, "src", ahd.path, "type", ahd.type, "size", ahd.size, "ah_id", ahd.ah_id, "uploaded_at", ahd.uploaded_at)), 
                JSON_ARRAY()) 
                FROM ${TABLE.$ALASHAK.DOCS} AS ahd
                WHERE ahd.ah_id = ah.id
                ) as documents
                `,
                ),
            )
            .groupBy("ah.id")
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

/**
 *
 * @param {Number} limit
 * @param {Number} offset
 * @param {String} search
 * @param {Array} columns
 * @returns
 */
export async function getAll(limit, offset, search, columns) {
    try {
        const data = await db(`${TABLE.ALASHAK} as ah`)
            .leftJoin(
                `${TABLE.$ADDRESS.KEL} as kel`,
                "kel.id",
                "ah.address_code",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.KEC} as kec`,
                "kec.id",
                "kel.id_kecamatan",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.KAB} as kab`,
                "kab.id",
                "kec.id_kabupaten",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.PROV} as prov`,
                "prov.id",
                "kab.id_provinsi",
            )
            .leftJoin("types", "types.id", "ah.type_id")
            .select([
                "ah.id",
                "ah.no_alas_hak",
                "ah.luas",
                "ah.tgl_alas_hak",
                "ah.ket",
                "types.name as jenis_hak",
            ])
            .select(
                db.raw(`
                JSON_OBJECT("jorong", ah.jor, "kelurahan", kel.name, "kecamatan", kec.name, "kabupaten", kab.name, "provinsi", prov.name) AS address
                `),
            )
            .select(
                db.raw(`
                   (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT("fullname", cl.fullname, "nik", cl.nik)), JSON_ARRAY()) FROM ${TABLE.$ALASHAK.CLIENTS} AS ahc 
                   LEFT JOIN ${TABLE.CLIENTS} AS cl ON cl.id = ahc.client_id
                   WHERE ahc.alas_hak_id = ah.id) as owners
                `),
            )
            .where(function (builder) {
                if (!search) return;

                let first = true;

                columns.forEach((col) => {
                    const addClause = (column) => {
                        if (first) {
                            builder.whereILike(column, `%${search}%`);
                            first = false;
                        } else {
                            builder.orWhereILike(column, `%${search}%`);
                        }
                    };

                    if (col !== "address_code") {
                        addClause(`ah.${col}`);
                    } else {
                        addClause("kel.name");
                        builder.orWhereILike("kec.name", `%${search}%`);
                        builder.orWhereILike("kab.name", `%${search}%`);
                        builder.orWhereILike("prov.name", `%${search}%`);
                    }
                });
            })
            .limit(limit || 10)
            .offset(offset || 0);

        const [{ count }] = await db(TABLE.ALASHAK)
            .where(function (builder) {
                if (search) {
                    columns.forEach((value, index) => {
                        if (index === 0)
                            builder.whereILike(`${value}`, `%${search}%`);
                        else builder.andWhereILike(`${value}`, `%${search}%`);
                    });
                }
            })
            .count("id as count");
        return { data, count };
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

export async function getFilteredAlasHak(limit, offset, filters) {
    try {
        const data = await db(`${TABLE.ALASHAK} as ah`)
            .where("ah.no_alas_hak", "like", `%${filters.nomor || ""}%`)
            .modify((queryBuilder) => {
                if (filters.address_code)
                    queryBuilder.andWhere(
                        "ah.address_code",
                        "like",
                        `${filters.address_code}%`,
                    );
            })
            .leftJoin(
                `${TABLE.$ADDRESS.KEL} as kel`,
                "kel.id",
                "ah.address_code",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.KEC} as kec`,
                "kec.id",
                "kel.id_kecamatan",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.KAB} as kab`,
                "kab.id",
                "kec.id_kabupaten",
            )
            .leftJoin(
                `${TABLE.$ADDRESS.PROV} as prov`,
                "prov.id",
                "kab.id_provinsi",
            )
            .leftJoin("types", "types.id", "ah.type_id")
            .select([
                "ah.id",
                "ah.no_alas_hak",
                "ah.luas",
                "ah.tgl_alas_hak",
                "ah.ket",
                "types.name as jenis_hak",
            ])
            .select(
                db.raw(`
                JSON_OBJECT("jorong", ah.jor, "kelurahan", kel.name, "kecamatan", kec.name, "kabupaten", kab.name, "provinsi", prov.name) AS address
                `),
            )
            .orderBy("ah.id", "asc")
            .limit(limit)
            .offset(offset);

        const [{ count }] = await db(`${TABLE.ALASHAK} as ah`)
            .where("ah.no_alas_hak", "like", `%${filters.nomor || ""}%`)
            .modify((queryBuilder) => {
                if (filters.address_code)
                    queryBuilder.andWhere(
                        "ah.address_code",
                        "like",
                        `${filters.address_code}%`,
                    );
            })
            .count("ah.id as count");

        return { data, count };
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
 * @param {Number} id
 * @returns
 */
export async function getOwners(id) {
    try {
        return await db(`${TABLE.$ALASHAK.CLIENTS} as ahc`)
            .leftJoin(`${TABLE.CLIENTS} as cl`, "cl.id", "ahc.client_id")
            .where("ahc.alas_hak_id", id)
            .select("cl.id", "cl.nik", "cl.fullname")
            .limit(10)
            .offset(0);
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

export async function getAlasHakTypes() {
    try {
        const types = await db(TABLE.$ALASHAK.TYPES).select("*");
        return types;
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
