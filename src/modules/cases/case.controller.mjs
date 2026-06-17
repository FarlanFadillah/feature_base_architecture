import { asyncHandler } from "../../shared/utils/asyncHandler.mjs";
import * as casesService from "./case.service.mjs";
import httpStatus from "http-status";

export const createCase = asyncHandler(async (req, res, next) => {
    const id = await casesService.create(req.matchedData);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Proses Alas Hak added Successfully",
        data: {
            id,
        },
    });
});

export const updateCase = asyncHandler(async (req, res, next) => {
    const { id, ...data } = req.matchedData;
    await casesService.update(id, data);

    res.status(httpStatus.OK).json({
        status: true,
        message: "Proses Alas Hak updated successfully",
    });
});

export const removeCase = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    await casesService.remove(id);
    res.status(httpStatus.OK).json({
        success: true,
        message: "Proses Alas Hak remove successfully",
    });
});

export const getCase = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    const cases = await casesService.getCaseWithDetails(id);
    res.status(httpStatus.OK).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            cases: cases,
        },
    });
});

export const validateStep = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    const data = req.body;
    await casesService.validateStep(id, data);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Current is valid, you can proceed to the next step",
    });
});

export const nextStep = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;
    const finished = await casesService.nextStep(id);

    res.status(httpStatus.OK).json({
        success: true,
        message: finished
            ? "Case is finished"
            : "Case is processed to the next step",
    });
});

export const prevStep = asyncHandler(async (req, res, next) => {
    const { id } = req.matchedData;

    await casesService.prevStep(id);

    res.status(httpStatus.OK).json({
        success: true,
        message: "Sending back to the previous step",
    });
});

export const getAllCases = asyncHandler(async (req, res, next) => {
    const { currentpage, limit } = req.matchedData;

    const { cases, _metadata } = await casesService.getAll(
        Number(currentpage),
        Number(limit),
    );
    res.status(httpStatus.OK).json({
        success: true,
        message:
            cases.length > 0 ? "Data retrieved successfully" : "No Data found",
        data: {
            _metadata: _metadata,
            cases: cases,
        },
    });
});

export const searchByDate = asyncHandler(async (req, res, next) => {
    const { currentpage, limit, from, to, code = null } = req.matchedData;
    const { cases, _metadata } = await casesService.getFilteredCases(
        Number(currentpage),
        Number(limit),
        { from, to, code },
    );
    res.status(httpStatus.OK).json({
        success: true,
        message:
            cases.length > 0 ? "Data retrieved successfully" : "No Data found",
        data: {
            _metadata: _metadata,
            cases: cases,
        },
    });
});

export const getRoles = asyncHandler(async (req, res, next) => {
    const roles = await casesService.getRoles();
    res.status(httpStatus.OK).json({
        success: true,
        message: "Data retrieved successfully",
        data: { roles: roles },
    });
});
