import { matchedData, validationResult } from "express-validator";
import { ExpressError } from "../utils/custom.error.mjs";
import createDebug from "debug";

const debug = createDebug("app:middleware:validator");

export function validate(req, res, next) {
    // debug(req.body);
    const result = validationResult(req);
    if (result.isEmpty()) {
        debug("[REQUEST VALID]");
        req.matchedData = matchedData(req);
        return next();
    }

    const errors = {};
    result.errors.map((data) => (errors[data.path] = data.msg));

    res.status(422).json({
        status: false,
        message: "validation failed",
        errors,
    });
}
