import { KnexError } from "../utils/custom.error.mjs";
import http from "http-status";
import { UNIQUE } from "../../configs/sql.config.mjs";

/**
 *
 * @param {KnexError} err
 */
export function getErrorResponse(err) {
    const error = {
        message: "",
        status: 400,
    };
    switch (err.code) {
        case "ER_DUP_ENTRY":
            const { key, value } = duplicateEntryError(err.sqlMessage);
            error.message = `${UNIQUE[key]} with value ${value} already exists`;
            error.status = http.CONFLICT;
            break;
        default:
            error.message = "Internal Server Error";
            error.status = http.INTERNAL_SERVER_ERROR;
            break;
    }
    return error;
}

// local functions

function duplicateEntryError(sqlMessage) {
    const [value, key] = sqlMessage
        .match(/'([^']*)'/g)
        .map((s) => s.replace(/'/g, ""));
    return {
        key: key.split(".")[1],
        value,
    };
}
