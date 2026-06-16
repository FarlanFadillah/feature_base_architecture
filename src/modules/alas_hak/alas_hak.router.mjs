import express from "express";
import * as ctrl from "./alas_hak.controller.mjs";
import * as rules from "./alas_hak.validator.mjs";

import * as mainRules from "../../shared/validator/validation.rules.mjs";
import * as cache from "../../shared/middlewares/caching.middleware.mjs";
import { validateToken } from "../../shared/middlewares/jwt.middleware.mjs";
import { validate } from "../../shared/middlewares/validator.middleware.mjs";
import { pagination } from "../../shared/middlewares/pagination.middleware.mjs";
import { keyBuilder } from "../../shared/utils/cachekeybuilder.mjs";
import { upload } from "../../shared/middlewares/upload.middleware.js";

const router = express.Router();

router.use(validateToken);

router
    .route("/")
    .post(...rules.addAlasHakValidationRules, validate, ctrl.addAlasHak)
    .get(
        ...mainRules.paginationValidationRules,
        ...rules.searchAlasHakValidationRules,
        validate,
        pagination,
        cache.cachingMiddleware(keyBuilder("alas-hak:list")),
        ctrl.getAllAlasHak,
    );

router.get("/types", ctrl.getAlasHakTypes);

router
    .route("/:id")
    .patch(
        ...mainRules.IDValidationRules,
        ...rules.updateAlasHakValidationRules,
        validate,
        ctrl.updateAlasHak,
    )
    .put(
        ...mainRules.IDValidationRules,
        ...rules.addAlasHakValidationRules,
        validate,
        ctrl.updateAlasHak,
    )
    .delete(...mainRules.IDValidationRules, validate, ctrl.removeAlasHak)
    .get(
        ...mainRules.IDValidationRules,
        validate,
        cache.cachingMiddleware(keyBuilder("alas-hak")),
        ctrl.getAlasHak,
    );

router.get(
    "/:id/edit",
    ...mainRules.IDValidationRules,
    validate,
    ctrl.getAlasHakForUpdate,
);

router
    .route("/:id/uploads")
    .post(
        upload.single("document"),
        ...mainRules.IDValidationRules,
        ...rules.fileNameValidtationRules,
        validate,
        ctrl.uploadDocument,
    )
    .delete(
        ...mainRules.IDValidationRules,
        ...rules.deleteDocumentValidationRules,
        validate,
        ctrl.deleteDocument,
    );

router
    .route("/:id/owners")
    .post(
        ...mainRules.IDValidationRules,
        ...rules.addAlasHakOwnerValidationRules,
        validate,
        ctrl.addAlasHakOwner,
    )
    .get(
        ...mainRules.IDValidationRules,
        validate,
        cache.cachingMiddleware(keyBuilder("alas-hak:clients")),
        ctrl.getAlasHakOwners,
    );

router
    .route("/:id/owners/:client_id")
    .delete(
        ...mainRules.IDValidationRules,
        ...rules.removeAlasHakOwnerValidationRules,
        validate,
        ctrl.removeAlasHakOwners,
    );

export { router as default };
