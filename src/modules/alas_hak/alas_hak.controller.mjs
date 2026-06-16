import { asyncHandler } from "../../shared/utils/asyncHandler.mjs";
import * as alasHakService from "./alas_hak.service.mjs";

export const addAlasHak = asyncHandler(async (req, res, next) => {
    const { clients, ...data } = req.matchedData;
    const id = await alasHakService.addAlasHak(data, clients);

    res.status(200).json({
        success: true,
        message: "Alas Hak added successfully",
        data: {
            id,
        },
    });
});

export const updateAlasHak = asyncHandler(async (req, res, next) => {
    const { id, ...data } = req.matchedData;

    await alasHakService.updateAlasHak(id, data);

    res.status(200).json({
        success: true,
        message: "Alas Hak updated successfully",
    });
});

export const removeAlasHak = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;

    await alasHakService.removeAlasHak(id);

    res.status(200).json({
        success: true,
        message: "Alas Hak deleted successfully",
    });
});

export const uploadDocument = asyncHandler(async (req, res, next) => {
    const { id, type } = req.matchedData;
    const { filename, size } = req.file;
    const path = `/uploads/${filename}`;

    await alasHakService.saveAlasHakDocument(id, path, type, size);

    res.status(200).json({
        success: true,
        message: "File uploaded successfully",
    });
});

export const deleteDocument = asyncHandler(async (req, res, next) => {
    const { id, doc_id } = req.matchedData;

    await alasHakService.removeAlasHakDocument(id, doc_id);

    res.status(200).json({
        success: true,
        message: "File deleted successfully",
    });
});

export const getAlasHak = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;

    const alas_hak = await alasHakService.getAlasHak(Number(id));
    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            alas_hak: alas_hak,
        },
    });
});

export const getAlasHakForUpdate = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    const alas_hak = await alasHakService.getAlasHakForUpdate(id);

    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            alas_hak: alas_hak,
        },
    });
});

export const getAllAlasHak = asyncHandler(async (req, res, next) => {
    const { currentpage, limit, search = null } = req.matchedData;

    const { alas_hak, _metadata } = await alasHakService.getAllAlasHak(
        Number(limit),
        Number(currentpage),
        search,
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

export const addAlasHakOwner = asyncHandler(async (req, res, next) => {
    const { id, clients } = req.matchedData;
    await alasHakService.addAlasHakOwner(id, clients);

    res.status(200).json({
        success: true,
        message: "Alas Hak - Client relations processed",
        data: {},
    });
});

export const removeAlasHakOwners = asyncHandler(async (req, res, next) => {
    const { id, client_id } = req.matchedData;

    await alasHakService.removeAlasHakOwner(id, client_id);

    res.status(200).json({
        success: true,
        message: "Alas Hak - Client relations removed successfully",
    });
});

export const getAlasHakOwners = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;

    const owners = await alasHakService.getOwners(id);
    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: { owners: owners },
    });
});

export const getAlasHakTypes = asyncHandler(async (req, res, next) => {
    const types = await alasHakService.getAlasHakTypes();

    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            types,
        },
    });
});
