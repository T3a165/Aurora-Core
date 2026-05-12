import http from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./env.js";
import { log } from "./log.js";
import v1 from "./routes/v1.js";
import { errorHandler, notFound } from "./errors.js";
import { attachWs } from "./ws.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(pinoHttp({ logger: log }));

app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));
app.get("/metrics", (_, res) => res.type("text/plain").send("# metrics_stub 1\n"));

app.use("/v1", v1);
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
attachWs(server);
server.listen(env.PORT, () => log.info({ port: env.PORT }, "aurora_api_listening"));
