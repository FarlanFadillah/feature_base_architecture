import createDebug from "debug";
import { ApiError, ExpressError, KnexError } from "../utils/custom.error.mjs";
import * as errorHelper from "../helper/error.helper.mjs";
const debug = createDebug("app:middleware:errors");

/*
 api response format
 {
    success : true | false,
    message : 'this is the message'
    errors : [
        {
            "timestamp":"2019-09-16T22:14:45.624+0000",
            "status":500,
            "error":"Internal Server Error",
            "message":"No message available",
            "path":"/api/book/1"
        }
    ],
    data : {
        "users" : [], // if its an array
        "user" : {} // if its a single object
    }
 
 }
 */

/**
 *
 * @param {Error} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function globalErrorHandler(err, req, res, next) {
    debug("[GLOBAL ERROR HANDLER]");
    console.error(err);
    if (err instanceof KnexError) {
        const { message, status } = errorHelper.getErrorResponse(err);
        return res.status(status).json({
            success: false,
            errors: {
                timestamps: new Date().toISOString(),
                status: status,
                message: message,
                path: req.url,
            },
        });
    }
    if (err instanceof ApiError || err instanceof ExpressError) {
        return res.status(err.http_status || 400).json({
            success: false,
            errors: {
                timestamps: new Date().toISOString(),
                status: err.http_status,
                error: err.message,
                path: req.url,
            },
        });
    }
}

export function missingEndpoint(req, res, next) {
    res.status(500).json({
        success: false,
        errors: {
            message: `Endpoint '${req.url}' does not extists!`,
            path: req.url,
        },
    });
}
