import * as jwtHelper from "../helper/jwt.helper.mjs";
import { asyncHandler } from "../utils/asyncHandler.mjs";
import { ExpressError } from "../utils/custom.error.mjs";
import createDebug from "debug";

const debug = createDebug("app:middleware:jwt");

/**
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {*} next
 */
export const validateToken = asyncHandler(async (req, res, next) => {
    // if (process.env.NODE_ENV === "development") return next();
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return next(
            new ExpressError(
                "Unauthorized, please provide the authorization headers",
                401,
            ),
        );
    const { decoded, user } = await jwtHelper.verifyUser(
        authHeader.split(" ")[1],
    );
    debug("[TOKEN VALID]");
    req.user = decoded;
    req.user.role = user.role;
    req.user.fullname = [user.first_name, user.last_name].join(" ");
    next();
});
