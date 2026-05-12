import { db } from "../db.js";
import { pub, channel } from "../redis.js";
import { patchState, getState } from "./state.js";
import { decide } from "./scoring.js";
import type { Mode } from "./types.js";

interface EventInput {
  domain: "ENERGY" | "BIOMETRIC" | "ENVIRONMENT";
  kind: string; value: number; payload?: any;
}

const MAP: Record<string, [keyof Awaited<ReturnType<typeof getState>>, string]> = {
  load_w:           ["energy", "loadW"],
  solar_w:          ["energy", "solarW"],
  battery_soc:      ["energy", "batterySoc"],
  grid_price_cents: ["energy", "gridPriceCents"],
  hr_bpm:           ["bio",    "hr"],
  hrv_ms:           ["bio",    "hrv"],
  stress:           ["bio",    "stress"],
  temp_c:           ["env",    "tempC"],
  humidity:         ["env",    "humidity"],
  co2_ppm:          ["env",    "co2Ppm"],
  pm25:             ["env",    "pm25"],
};

export async function ingest(installationId: string, ev: EventInput) {
  await db.event.create({ data: { installationId, ...ev } });
  const m = MAP[ev.kind];
  if (!m) return null;
  const [bucket, field] = m;
  const patch: any = { [bucket]: { [field]: ev.value } };
  const state = await patchState(installationId, patch);

  const cfg = await db.modeConfig.findUnique({ where: { installationId } });
  const mode = (cfg?.active ?? "habitat_optimizer") as Mode;
  const result = decide(state, mode);

  const insight = await db.insight.create({
    data: { installationId, score: result.score, breakdown: result.breakdown, signals: result.signals as any },
  });

  // Persist actions as PENDING; downstream device adapters will execute.
  for (const a of result.actions) {
    const dev = await db.device.findFirst({ where: { installationId, kind: a.deviceKind } });
    if (!dev) continue;
    const action = await db.action.create({
      data: { installationId, deviceId: dev.id, command: a.command, args: a.args, reason: a.reason },
    });
    await db.auditLog.create({
      data: { installationId, actor: "engine", action: "device.command", target: dev.id, meta: { command: a.command, reason: a.reason } },
    });
    await pub.publish(channel(installationId), JSON.stringify({ type: "action", action }));
  }

  await pub.publish(channel(installationId), JSON.stringify({ type: "score", score: result.score, breakdown: result.breakdown, signals: result.signals }));
  await pub.publish(channel(installationId), JSON.stringify({ type: "state", state }));

  return { insight, result, state };
}
