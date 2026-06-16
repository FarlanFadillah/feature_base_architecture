import { ExpressError } from "../../shared/utils/custom.error.mjs";
import * as clientRepo from "./client.repository.mjs";
import * as mainRepo from "../../shared/repositories/main.repository.mjs";
import * as jsonHelper from "../../shared/helper/json.helper.mjs";
import * as cache from "../../shared/utils/cache.mjs";
import db from "../../dbs/db.mjs";
import * as fileUtils from "../../shared/utils/file.js";

/**
 *
 * @param {Object} model
 * @returns
 */
export async function addClient(model) {
    try {
        const data = await mainRepo.create("clients", model);

        cache.delByPattern(":clients:list:");
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 */
export async function removeClient(id) {
    try {
        await mainRepo.remove("clients", id);

        cache.delByPattern(`clients:id:${id}`);
        cache.delByPattern("clients:list");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @param {Object} data
 */
export async function updateClientData(id, data) {
    try {
        await mainRepo.update("clients", id, data);

        cache.delByPattern(`:clients:id:${id}`);
        cache.delByPattern(":clients:list:");
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} cl_id
 * @param {String} type
 * @param {String} path
 * @param {Number} fileSize
 */
export async function saveClientDocument(cl_id, type, path, fileSize) {
    try {
        await db.transaction(async (trx) => {
            const exists = await mainRepo.isExists("clients", cl_id, trx);
            if (!exists)
                throw new ExpressError(
                    `Client with id ${cl_id} does not extist`,
                );
            await clientRepo.saveDocs(
                { cl_id, type, path, size: fileSize },
                trx,
            );
        });
        cache.delByPattern(`:clients:list:`);
        cache.delByPattern(`:clients:id:${cl_id}`);
    } catch (error) {
        await fileUtils.deleteFile(path);
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @param {Number} doc_id
 * @param {String} path
 */
export async function deleteCLientDocument(id, doc_id) {
    try {
        console.log(id, doc_id);
        await db.transaction(async (trx) => {
            const docs = await clientRepo.lockDocForUpdate(doc_id, trx);
            if (!docs) throw new ExpressError("Document not found", 404);

            await clientRepo.delDocs(docs.id, trx);
            if (fileUtils.isExists(docs.path)) {
                fileUtils.deleteFile(docs.path);
            }
        });

        cache.delByPattern(`:clients:list:`);
        cache.delByPattern(`:clients:id:${id}`);
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} id
 * @returns
 */
export async function getClient(id) {
    try {
        const clients = await clientRepo.getByIdWithDetails(Number(id));
        if (!clients) throw new ExpressError("Client Not Found", 404);
        return clients;
    } catch (error) {
        throw error;
    }
}

export async function getClientForUpdate(id) {
    try {
        const client = await clientRepo.getById(id);
        if (!client) throw new ExpressError("Client not found", 404);
        return client;
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} limit
 * @param {String} cursor
 * @param {String} order
 * @returns
 */
export async function getAllClients(limit, cursor, order = "asc") {
    try {
        return await clientRepo.getAll(limit, cursor | 0, "id", order);
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} limit
 * @param {Number} offset
 * @param {String} search
 * @returns
 */
export async function getAllClientsLimitOffset(
    limit,
    currentpage,
    search = null,
) {
    try {
        const offset = (currentpage - 1) * limit;
        const { data, count } = await clientRepo.getAllLimitOffset(
            limit,
            offset,
            search,
            ["nik", "fullname"],
        );

        const _metadata = jsonHelper.paginationMetadata(
            "clients",
            currentpage,
            limit,
            count,
        );

        // const clients = jsonHelper.destructureAddressesDetails(data);
        return { clients: data, _metadata };
    } catch (error) {
        throw error;
    }
}

/**
 *
 * @param {Number} client_id
 * @param {Number} limit
 * @param {Number} currentpage
 * @returns
 */
export async function getAlasHak(client_id, limit, currentpage) {
    try {
        const offset = (currentpage - 1) * limit;
        const { data, count } = await clientRepo.getAlasHak(
            client_id,
            limit,
            offset,
        );

        // const alas_hak = jsonHelper.destructureAddressesDetails(data);
        const _metadata = jsonHelper.paginationMetadata(
            `clients/${client_id}/alas-hak`,
            currentpage,
            limit,
            count,
        );

        return { alas_hak: data, _metadata };
    } catch (error) {
        throw error;
    }
}
