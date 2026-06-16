import "../env.mjs";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import createDebug from "debug";
import path from "path";
const debug = createDebug("app:src:main");

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

import routerV1 from "./routes.mjs";

// middlewares
import {
    globalErrorHandler,
    missingEndpoint,
} from "./shared/middlewares/error.middleware.mjs";

const app = express();
app.set("etag", false);
// app.set("trust proxy", true);

app.use(express.json({ type: "application/json" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());
app.use("/public", express.static(path.resolve("public")));

app.use("/api/v1", routerV1);

app.use(globalErrorHandler);
app.use(missingEndpoint);

const PORT = process.env.PORT || 3030;
const server = app.listen(PORT, "0.0.0.0", (error) => {
    if (error) debug(error);
    else debug(`Server listening on http://localhost:${PORT}`);
});

// proper server shutdown function
function shutdown() {
    console.log("Shuting down server...");
    server.close((err) => {
        if (err) console.log(err);
        console.log("Server closed");
        process.exit(0);
    });
}

// signal interupt
process.on("SIGINT", shutdown);
// signal terminate
process.on("SIGTERM", shutdown);
// signal user defined
process.on("SIGUSR2", shutdown);
