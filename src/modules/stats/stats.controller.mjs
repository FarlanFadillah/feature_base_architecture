import { asyncHandler } from "../../shared/utils/asyncHandler.mjs";
import * as statsService from "./stats.service.mjs";
export const getStats = asyncHandler(async (req, res, next) => {
    const { data: stats, result } = await statsService.getStats();

    res.status(200).json({
        success: true,
        message: "Data retrieved successfully",
        data: {
            count: result,
            stats: stats,
        },
    });
});
