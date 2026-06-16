import clientRouter from "./modules/clients/client.router.mjs";
import authRouter from "./modules/auth/auth.router.mjs";
import addressRouter from "./modules/address/address.router.mjs";
import alasHakRouter from "./modules/alas_hak/alas_hak.router.mjs";
import casesRouter from "./modules/cases/case.router.mjs";
import statsRouter from "./modules/stats/stats.router.mjs";
import express from "express";

const router = express.Router();

const defaultRoutes = [
    {
        path: "/auth",
        router: authRouter,
    },
    {
        path: "/address",
        router: addressRouter,
    },
    {
        path: "/alas-hak",
        router: alasHakRouter,
    },
    {
        path: "/cases",
        router: casesRouter,
    },
    {
        path: "/stats",
        router: statsRouter,
    },
    {
        path: "/clients",
        router: clientRouter,
    },
];

defaultRoutes.forEach((val) => {
    router.use(val.path, val.router);
});

export default router;
