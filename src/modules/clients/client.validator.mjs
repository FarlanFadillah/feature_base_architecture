import * as validator from "../../shared/utils/validators.mjs";

export const createClientValidationRules = [
    validator
        .numericalRequired("nik")
        .isLength({ min: 16, max: 16 })
        .withMessage("NIK lenght must be 16 characters"),
    validator.stringRequired("fullname"),
    validator.addressRequired("address_code"),
    validator.stringRequired("gender"),
    validator.mobilePhoneOptional("phone_number"),
    validator.booleanOptional("is_deceased"),
];

export const patchClientValidationRules = [
    validator
        .numericalOptional("nik")
        .isLength({ min: 16, max: 16 })
        .withMessage("NIK lenght must be 16 characters"),

    validator.stringOptional("fullname"),
    validator.addressOptional("address_code"),
    validator.stringOptional("gender"),
    validator.mobilePhoneOptional("phone_number"),
];

export const searchValidationRules = [
    validator.stringOptional("search", "query"),
];

export const deleteDocumentValidationRules = [
    validator.numericalRequired("doc_id", "query"),
];

export const filenameValidationRules = [validator.stringRequired("type")];
