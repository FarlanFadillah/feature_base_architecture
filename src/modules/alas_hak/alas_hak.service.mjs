import { ApiError, ExpressError } from "../../shared/utils/custom.error.mjs";
import * as mainRepo from "../../shared/repositories/main.repository.mjs";
import * as alasHakRepo from "./alas_hak.repository.mjs";
import * as jsonHelper from "../../shared/helper/json.helper.mjs";
import * as cache from "../../shared/utils/cache.mjs";
import * as fileUtils from "../../shared/utils/file.js";
import db from "../../dbs/db.mjs";

/**
 *
 * @param {Object} data
 * @param {Array} clients
 */
export async function addAlasHak(data, clients) {
    try {
        const id = await db.transaction(async (trx) => {
            const id = await alasHakRepo.addAlasHak(data, trx);
            if (!id) throw ApiError("Something Broke", 500);

            await alasHakRepo.setOwner(id, clients, trx);
            return id;
        });
        clients.forEach((value) => {
            cache.delByPattern(`:alas-hak:id:${value.id}:`);
        });
        cache.delByPattern(":alas-hak:list:");
        return id;
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 */
export async function removeAlasHak(id) {
    try {
        await mainRepo.remove("alas_hak", id);

        cache.delByPattern(`:alas-hak:id:${id}`);
        cache.delByPattern(":alas-hak:list:");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @param {Object} model
 */
export async function updateAlasHak(id, model) {
    try {
        await db.transaction(async (trx) => {
            const { clients, ...data } = model;
            const exists = await alasHakRepo.getById(id, trx);
            if (!exists) throw new ApiError("Alas Hak Tidak ditemukan", 404);

            if (data) await mainRepo.update("alas_hak", id, data, trx);
            if (clients || clients?.length > 0) {
                await alasHakRepo.setOwner(id, clients, trx);
                clients.forEach((value) => {
                    cache.delByPattern(`:alas-hak:id:${value.id}:`);
                });
                cache.delByPattern(":alas-hak:list:");
            }
        });

        cache.delByPattern(`:alas-hak:id:${id}`);
        cache.delByPattern(":alas-hak:list:");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} alas_hak_id
 * @param {Array} clients
 */
export async function addAlasHakOwner(alas_hak_id, clients) {
    try {
        await db.transaction(async (trx) => {
            const exists = await alasHakRepo.getById(alas_hak_id, trx);
            if (!exists) throw new ApiError("Alas Hak Tidak ditemukan", 404);

            await alasHakRepo.setOwner(alas_hak_id, clients, trx);
        });

        clients.forEach((value) => {
            cache.delByPattern(`:alas-hak:id:${value.id}:`);
        });
        cache.delByPattern(":alas-hak:list:");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} alas_hak_id
 * @param {Number} client_id
 */
export async function removeAlasHakOwner(alas_hak_id, client_id) {
    try {
        await db.transaction(async (trx) => {
            const exists = await alasHakRepo.getById(alas_hak_id, trx);
            if (!exists) throw new ApiError("Alas Hak Tidak ditemukan", 404);

            await alasHakRepo.removeOwner(alas_hak_id, client_id, trx);
        });

        cache.delByPattern(":alas-hak:clients:");
        cache.delByPattern(`:alas-hak:id:${alas_hak_id}`);
        cache.delByPattern(":alas-hak:list:");
        cache.delByPattern(`:clients:id:${client_id}`);
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @param {String} path
 * @param {String} type
 * @param {Number} size
 */
export async function saveAlasHakDocument(id, path, type, size) {
    try {
        await db.transaction(async (trx) => {
            const exist = await mainRepo.isExists("alas_hak", id, trx);
            if (!exist) throw new ApiError("Alas Hak tidak ditemukan", 404);

            await alasHakRepo.saveDocument(
                { ah_id: id, path: path, type: type, size: size },
                trx,
            );
        });

        cache.delByPattern(":alas-hak:list:");
        cache.delByPattern(`:alas-hak:id:${id}`);
    } catch (error) {
        await fileUtils.deleteFile(path);
        throw error;
    }
}

/**
 *
 * @param {Number} ah_id
 * @param {Number} doc_id
 * @param {String} path
 */
export async function removeAlasHakDocument(ah_id, doc_id) {
    try {
        await db.transaction(async (trx) => {
            const doc = await alasHakRepo.lockDocsForUpdate(doc_id, trx);
            console.log(doc);
            if (!doc) throw new ApiError("Document not found", 404);

            await alasHakRepo.deleteDocument(ah_id, doc_id, trx);

            if (fileUtils.isExists(doc.path)) {
                fileUtils.deleteFile(doc.path);
            }
        });
        cache.delByPattern(":alas-hak:list:");
        cache.delByPattern(`:alas-hak:id:${ah_id}`);
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @returns
 */
export async function getAlasHak(id) {
    try {
        const data = await alasHakRepo.getWithDetails(id);
        if (!data) throw new ExpressError("Alas Hak not found", 404);
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @returns
 */
export async function getAlasHakForUpdate(id) {
    try {
        const data = await alasHakRepo.getById(id);
        if (!data) throw new ExpressError("Alas Hak not found", 404);
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} limit
 * @param {Number} currentpage
 * @param {String} search
 * @returns
 */
export async function getAllAlasHak(limit, currentpage, search) {
    try {
        const offset = (currentpage - 1) * limit;
        const { data, count } = await alasHakRepo.getAll(
            limit,
            offset,
            search,
            ["no_alas_hak", "address_code"],
        );
        // const alas_hak = jsonHelper.destructureAddressesDetails(data);
        const _metadata = jsonHelper.paginationMetadata(
            "alas-hak",
            currentpage,
            limit,
            count,
        );

        return { alas_hak: data, _metadata };
    } catch (error) {
        throw error;
    }
}

export async function getFilteredAlasHak(currentpage, limit, filters) {
    try {
        const offset = (currentpage - 1) * limit;
        const { data, count } = await alasHakRepo.getFilteredAlasHak(
            limit,
            offset,
            filters,
        );

        const _metadata = jsonHelper.paginationMetadata(
            "alas-hak/search",
            currentpage,
            limit,
            count,
            Object.keys(filters).reduce((acc, cur) => {
                if (filters[cur]) acc.push(`${cur}=${filters[cur]}`);
                return acc;
            }, []),
        );

        return { alas_hak: data, _metadata };
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @returns
 */
export async function getOwners(id) {
    try {
        let owners = await alasHakRepo.getOwners(id);
        owners = owners.map((val) => {
            return {
                ...val,
                link: `/api/v1/clients/${val.id}`,
            };
        });

        return owners;
    } catch (error) {
        throw error;
    }
}

export async function getAlasHakTypes() {
    try {
        return await alasHakRepo.getAlasHakTypes();
    } catch (error) {
        throw error;
    }
}
