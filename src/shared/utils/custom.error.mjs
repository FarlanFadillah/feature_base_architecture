import http from "http-status";

export class ExpressError extends Error {
    constructor(message, http_status = 400, error_code = "SOMETHING_BROKE") {
        super(message);
        this.http_status = http_status;
        this.error_code = error_code;
    }
}
export class ApiError extends Error {
    constructor(message, http_status = 400) {
        super(message);
        this.http_status = http_status;
    }
}

/**
 * For Knex Error expect the error object contain these fields
 *  {
        code: 'ER_BAD_TABLE_ERROR',
        errno: 1051,
        sqlState: '42S02',
        sqlMessage: "Unknown table 'cl'",
        sql: 'some sql query'
    } 
 */
export class KnexError extends Error {
    constructor(message, code, errno, sqlState, sqlMessage, sql) {
        super(message);
        this.code = code;
        this.errno = errno;
        this.sqlState = sqlState;
        this.sqlMessage = sqlMessage;
        this.sql = sql;
    }
}
