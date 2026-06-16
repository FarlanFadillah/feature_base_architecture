import express from "express";
import * as ctrl from "./case.controller.mjs";
import * as rules from "./case.validator.mjs";
import * as mainRules from "../../shared/validator/validation.rules.mjs";
import * as cache from "../../shared/middlewares/caching.middleware.mjs";
import { validate } from "../../shared/middlewares/validator.middleware.mjs";
import { validateToken } from "../../shared/middlewares/jwt.middleware.mjs";
import { keyBuilder } from "../../shared/utils/cachekeybuilder.mjs";
import { pagination } from "../../shared/middlewares/pagination.middleware.mjs";

const router = express.Router();

router.use(validateToken);
router
    .route("/")
    .post(...rules.createProsesValidationRules, validate, ctrl.createCase)
    .get(
        ...mainRules.paginationValidationRules,
        validate,
        pagination,
        cache.cachingMiddleware(keyBuilder("cases:list")),
        ctrl.getAllCases,
    );

router.get(
    "/search",
    ...mainRules.paginationValidationRules,
    ...rules.searchValidationRules,
    validate,
    cache.cachingMiddleware(keyBuilder("cases:list")),
    ctrl.searchByDate,
);

router.get(
    "/roles",
    cache.cachingMiddleware(keyBuilder("cases")),
    ctrl.getRoles,
);

router
    .route("/:id/steps/next")
    .post(...mainRules.IDValidationRules, validate, ctrl.nextStep);
router
    .route("/:id/steps/validate")
    .post(...mainRules.IDValidationRules, validate, ctrl.validateStep);
router
    .route("/:id/steps/prev")
    .post(...mainRules.IDValidationRules, validate, ctrl.prevStep);

router
    .route("/:id")
    .delete(...mainRules.IDValidationRules, validate, ctrl.removeCase)
    .patch(
        ...mainRules.IDValidationRules,
        ...rules.patchProsesValidationRules,
        validate,
        ctrl.updateCase,
    )
    .put(
        ...mainRules.IDValidationRules,
        ...rules.createProsesValidationRules,
        validate,
        ctrl.updateCase,
    )
    .get(
        ...mainRules.IDValidationRules,
        validate,
        cache.cachingMiddleware(keyBuilder("cases")),
        ctrl.getCase,
    );

export default router;
