import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { apiKeyAuth } from "../auth.js";
import { rateLimit } from "../rateLimit.js";
import { ingest } from "../engine/ingest.js";
import { getState } from "../engine/state.js";
import { decide } from "../engine/scoring.js";
import { pub, channel } from "../redis.js";
import type { Mode } from "../engine/types.js";

const r = Router();
r.use(apiKeyAuth, rateLimit);

const eventSchema = z.object({
  domain: z.enum(["ENERGY", "BIOMETRIC", "ENVIRONMENT"]),
  kind: z.string().min(1).max(64),
  value: z.number().finite(),
  payload: z.any().optional(),
});

// POST /v1/events  — single or batch
r.post("/events", async (req, res, next) => {
  try {
    const body = Array.isArray(req.body) ? req.body : [req.body];
    const events = body.map((e) => eventSchema.parse(e));
    const out = [];
    for (const e of events) out.push(await ingest(req.installationId!, e));
    res.status(202).json({ accepted: events.length, results: out.map(o => o && { score: o.result.score }) });
  } catch (e) { next(e); }
});

// GET /v1/state
r.get("/state", async (req, res, next) => {
  try {
    const s = await getState(req.installationId!);
    res.json({ installationId: req.installationId, state: s });
  } catch (e) { next(e); }
});

// GET /v1/insights
r.get("/insights", async (req, res, next) => {
  try {
    const cfg = await db.modeConfig.findUnique({ where: { installationId: req.installationId! } });
    const mode = (cfg?.active ?? "habitat_optimizer") as Mode;
    const state = await getState(req.installationId!);
    const result = decide(state, mode);
    const recent = await db.insight.findMany({
      where: { installationId: req.installationId! }, orderBy: { ts: "desc" }, take: 20,
    });
    res.json({ current: result, history: recent });
  } catch (e) { next(e); }
});

// GET /v1/devices
r.get("/devices", async (req, res, next) => {
  try {
    const devices = await db.device.findMany({ where: { installationId: req.installationId! } });
    res.json({ devices });
  } catch (e) { next(e); }
});

// POST /v1/devices/:id/command
const cmdSchema = z.object({
  command: z.string().min(1).max(64),
  args: z.any().optional(),
  reason: z.string().max(256).optional(),
});
r.post("/devices/:id/command", async (req, res, next) => {
  try {
    const body = cmdSchema.parse(req.body);
    const dev = await db.device.findFirst({ where: { id: req.params.id, installationId: req.installationId! } });
    if (!dev) return res.status(404).json({ error: { code: "not_found", message: "Device not found" } });
    const action = await db.action.create({
      data: { installationId: req.installationId!, deviceId: dev.id, command: body.command, args: body.args, reason: body.reason ?? "manual" },
    });
    await db.auditLog.create({
      data: { installationId: req.installationId!, actor: `api_key:${req.apiKeyPrefix}`, action: "device.command", target: dev.id, meta: body },
    });
    await pub.publish(channel(req.installationId!), JSON.stringify({ type: "action", action }));
    res.status(202).json({ action });
  } catch (e) { next(e); }
});

// GET /v1/config/modes
r.get("/config/modes", async (req, res, next) => {
  try {
    const cfg = await db.modeConfig.findUnique({ where: { installationId: req.installationId! } });
    res.json({
      active: cfg?.active ?? "habitat_optimizer",
      available: [
        { id: "energy_guardian",   label: "Energy Guardian",   focus: "Cost, solar self-consumption, peak shaving" },
        { id: "health_sentinel",   label: "Health Sentinel",   focus: "HR, HRV, stress, recovery (non-medical)" },
        { id: "habitat_optimizer", label: "Habitat Optimizer", focus: "Balanced comfort and air quality" },
      ],
    });
  } catch (e) { next(e); }
});

// POST /v1/config/mode
const modeSchema = z.object({ mode: z.enum(["energy_guardian","health_sentinel","habitat_optimizer"]) });
r.post("/config/mode", async (req, res, next) => {
  try {
    const { mode } = modeSchema.parse(req.body);
    const cfg = await db.modeConfig.upsert({
      where: { installationId: req.installationId! },
      update: { active: mode },
      create: { installationId: req.installationId!, active: mode },
    });
    await db.auditLog.create({
      data: { installationId: req.installationId!, actor: `api_key:${req.apiKeyPrefix}`, action: "mode.set", meta: { mode } },
    });
    await pub.publish(channel(req.installationId!), JSON.stringify({ type: "mode", mode }));
    res.json({ mode: cfg.active });
  } catch (e) { next(e); }
});

export default r;
