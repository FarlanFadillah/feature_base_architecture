import { asyncHandler } from "../../shared/utils/asyncHandler.mjs";
import { ExpressError } from "../../shared/utils/custom.error.mjs";
import * as addressService from "./address.service.mjs";

export const getKelurahan = asyncHandler(async (req, res, next) => {
    const { currentpage, name, limit } = req.query;
    if (!name)
        return next(new ExpressError("please provide the name of the address"));
    if (isNaN(currentpage))
        return next(new ExpressError("Invalid currentpage value"));
    const kelurahan = await addressService.getKelurahan(
        name,
        Number(limit),
        Number(currentpage),
    );
    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: { addresses: kelurahan },
    });
});

export const getAllProvinsi = asyncHandler(async (req, res, next) => {
    const provinsi = await addressService.getAllProvinsi();

    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            addresses: provinsi,
        },
    });
});

export const getAllKabupaten = asyncHandler(async (req, res, next) => {
    const { id_provinsi } = req.query;
    const data = await addressService.getAllKabupaten(id_provinsi);

    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            addresses: data,
        },
    });
});

export const getAllKecamatan = asyncHandler(async (req, res, next) => {
    const { id_kabupaten } = req.query;
    const data = await addressService.getAllKecamatan(id_kabupaten);

    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            addresses: data,
        },
    });
});

export const getAllKelurahan = asyncHandler(async (req, res, next) => {
    const { id_kecamatan } = req.query;
    const data = await addressService.getAllKelurahan(id_kecamatan);

    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            addresses: data,
        },
    });
});
