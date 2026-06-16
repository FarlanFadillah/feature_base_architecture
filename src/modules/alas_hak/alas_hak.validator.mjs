import * as validator from "../../shared/utils/validators.mjs";

export const addAlasHakValidationRules = [
    validator.stringRequired("no_alas_hak"),
    validator.stringOptional("no_surat_ukur"),
    validator.stringOptional("jor"),
    validator.stringOptional("ket"),
    validator.dateOptional("tgl_alas_hak"),
    validator.dateOptional("tgl_surat_ukur"),
    validator.stringRequired("address_code"),
    validator.numericalRequired("type_id"),
    validator.numericalRequired("luas"),
    validator.numericalOptional("parent_id"),
    validator.isArrayOfObjectsRequired("clients"),
];

export const updateAlasHakValidationRules = [
    validator.stringOptional("no_alas_hak"),
    validator.stringOptional("no_surat_ukur"),
    validator.stringOptional("jor"),
    validator.stringOptional("ket"),
    validator.dateOptional("tgl_alas_hak"),
    validator.dateOptional("tgl_surat_ukur"),
    validator.stringOptional("address_code"),
    validator.numericalOptional("type_id"),
    validator.numericalOptional("luas"),
    validator.isArrayOfObjects("clients"),
];

export const searchAlasHakValidationRules = [
    validator.stringOptional("search", "query"),
];

export const addAlasHakOwnerValidationRules = [
    validator.isArrayOfObjects("clients"),
];

export const removeAlasHakOwnerValidationRules = [
    validator.numericalRequired("client_id", "param"),
];

export const fileNameValidtationRules = [validator.stringRequired("type")];

export const deleteDocumentValidationRules = [
    validator.numericalRequired("doc_id", "query"),
];
