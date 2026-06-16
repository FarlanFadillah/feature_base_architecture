import { body, check, param, query, validationResult } from "express-validator";
import db from "../../dbs/db.mjs";
import { ExpressError } from "./custom.error.mjs";

const validator = {
    body,
    param,
    query,
};

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 */
export function stringRequired(field, location = "body") {
    return validator[location](field)
        .trim()
        .notEmpty()
        .withMessage(`${field} can't be empty`)
        .matches(/^[^<>]*$/)
        .withMessage(field + " cant contain html element");
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 */
export function stringOptional(field, location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .trim()
        .matches(/^[^<>]*$/)
        .withMessage(field + " cant contain html element");
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 */
export function numericalOptional(field, location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .isNumeric()
        .withMessage(`${field} must be a numeric`);
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 */
export function numericalRequired(field, location = "body") {
    return validator[location](field)
        .notEmpty()
        .withMessage(`${field} can't be empty`)
        .isNumeric()
        .withMessage(`${field} must be a numeric`);
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @param {Number} min
 * @param {Number} max
 * @returns
 */
export function intRequired(field, location = "body", min, max) {
    const options = {};
    if (min !== undefined) options.min = min;
    if (max !== undefined) options.max = max;
    return validator[location](field)
        .notEmpty()
        .withMessage(`${field} can't be empty`)
        .isInt(options)
        .withMessage(`${field} must be an integer`);
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @param {Number} min
 * @param {Number} max
 * @returns
 */
export function intOptional(field, location = "body", min, max) {
    const options = {};
    if (min !== undefined) options.min = min;
    if (max !== undefined) options.max = max;
    return validator[location](field)
        .optional({ values: "falsy" })
        .isInt(options)
        .withMessage(`${field} must be an integer`);
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function mobilePhoneOptional(field, location = "body") {
    return validator[location](field)
        .optional({ values: "null" })
        .if(validator[location](field).notEmpty())
        .isMobilePhone()
        .withMessage(`Invalid ${field} value`);
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function mobilePhoneRequired(field, location = "body") {
    return validator[location](field)
        .notEmpty()
        .withMessage(`${field} can't be empty`)
        .isMobilePhone()
        .withMessage(`Invalid ${field} value`);
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function emailOptional(field = "email", location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .isEmail()
        .withMessage("Invalid email address")
        .normalizeEmail();
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function emailRequired(field = "email", location = "body") {
    return validator[location](field)
        .notEmpty()
        .withMessage(`${field} can't be empty`)
        .isEmail()
        .withMessage("Invalid email address")
        .normalizeEmail();
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function dateOptional(field, location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .isDate()
        .withMessage("Invalid date");
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function dateRequired(field, location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .isDate()
        .withMessage("Invalid date");
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function addressRequired(field, location = "body") {
    return validator[location](field).custom(async (value) => {
        const address = await db("kelurahan").where({ id: value });
        if (address.length <= 0) throw new Error("Invalid address code");
    });
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function addressOptional(field, location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .custom(async (value) => {
            const address = await db("kelurahan").where({ id: value });
            if (address.length <= 0) throw new Error("Invalid address code");
        });
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function arrayOfNumberRequired(field, location = "body") {
    return validator[location](field)
        .notEmpty()
        .withMessage(`${field} can't be empty`)
        .isArray({ min: 1 })
        .withMessage(`${field} must be an array`)
        .custom(async (value, { req }) => {
            try {
                value.forEach((val) => {
                    if (isNaN(val))
                        throw new ExpressError("The elements is not number");
                });
            } catch (error) {
                throw new ExpressError(`${field} must be an array`);
            }
        });
}

/**
 *
 * @param {String} field
 * @param {Array} arr
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function stringIncludeRequired(field, arr, location = "body") {
    return validator[location](field)
        .notEmpty()
        .withMessage(`${field} can't empty`)
        .custom(async (value, { req }) => {
            if (!arr.includes(value))
                throw new ExpressError(`Value invalid [${arr}]`);
        });
}

/**
 *
 * @param {String} field
 * @param {Array} arr
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function stringIncludeOptional(field, arr, location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .custom(async (value, { req }) => {
            if (!arr.includes(value))
                throw new ExpressError(`Value invalid [${arr}]`);
        });
}

/**
 *
 * @param {String} field
 * @returns {Array}
 */
export function isArrayOfObjects(field) {
    return [
        validator.body(field).optional().isArray({ min: 1 }),
        validator.body(`${field}.*`).optional().isObject({ strict: true }),
    ];
}

/**
 *
 * @param {String} field
 * @returns {Array}
 */
export function isArrayOfObjectsRequired(field) {
    return [
        validator
            .body(field)
            .isArray({ min: 1 })
            .withMessage("Clients can't be emtpy"),
        validator.body(`${field}.*`).isObject({ strict: true }),
    ];
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function booleanRequired(field, location = "body") {
    return validator[location](field)
        .notEmpty()
        .isBoolean()
        .withMessage(`${field} can't empty`);
}

/**
 *
 * @param {String} field
 * @param {"body" | "param" | "query"} location
 * @returns
 */
export function booleanOptional(field, location = "body") {
    return validator[location](field)
        .optional({ values: "falsy" })
        .isBoolean()
        .withMessage(`${field} can't empty`);
}
