import { asyncHandler } from "../../shared/utils/asyncHandler.mjs";
import * as clientService from "./client.service.mjs";

export const addClient = asyncHandler(async (req, res, next) => {
    const id = await clientService.addClient(req.matchedData);

    res.json({
        success: true,
        message: "Client added successfully",
        data: { id },
    });
});

export const getClient = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    const client = await clientService.getClient(id);
    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            client: client,
        },
    });
});

export const getClientForUpdate = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    const client = await clientService.getClientForUpdate(id);
    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            client: { ...client },
        },
    });
});

export const deleteClient = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    await clientService.removeClient(id);

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

export const uploadClientDocument = asyncHandler(async (req, res, next) => {
    const { id, type } = req.matchedData;
    const { filename, size } = req.file;
    const path = `/uploads/${filename}`;

    await clientService.saveClientDocument(id, type, path, size);

    res.status(200).json({
        success: true,
        message: "File uploaded successfully",
    });
});

export const deleteClientDocument = asyncHandler(async (req, res, next) => {
    const { id, doc_id } = req.matchedData;

    await clientService.deleteCLientDocument(id, doc_id);

    res.status(200).json({
        success: true,
        message: "Document delete successfully",
    });
});

export const updateClientData = asyncHandler(async (req, res, next) => {
    const { id, ...data } = req.matchedData;
    await clientService.updateClientData(id, data);

    res.status(200).json({
        success: true,
        message: "Client updated successfully",
    });
});

/**
 * Limit Offset based pagination
 */
export const getAllClientsLimitOffset = asyncHandler(async (req, res, next) => {
    const { currentpage, limit, search = null } = req.matchedData;

    const { clients, _metadata } = await clientService.getAllClientsLimitOffset(
        Number(limit),
        Number(currentpage),
        search,
    );

    res.status(200).json({
        success: true,
        message:
            clients.length > 0
                ? "Data retrieved successfully"
                : "No Data found",
        data: {
            _metadata: _metadata,
            clients: clients,
        },
    });
});

export const getAlasHak = asyncHandler(async (req, res, next) => {
    const { id, currentpage, limit } = req.matchedData;
    const { alas_hak, _metadata } = await clientService.getAlasHak(
        id,
        Number(limit),
        Number(currentpage),
    );
    res.status(200).json({
        success: true,
        message:
            alas_hak.length > 0
                ? "Data retrieved successfully"
                : "No Data found",
        data: {
            _metadata: _metadata,
            alas_hak: alas_hak,
        },
    });
});
