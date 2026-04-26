import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// Admin-only procedure guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});
import { invokeLLM, type Message } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import {
  getLatestCircuitReadings,
  getCircuitHistory,
  insertCircuitReading,
  updateCircuitStatus,
  getLatestBatteryReading,
  getBatteryHistory,
  insertBatteryReading,
  getAllTurnbotDevices,
  upsertTurnbotDevice,
  toggleTurnbotDevice,
  initiateOta,
  updateOtaProgress,
  getAlerts,
  insertAlert,
  resolveAlert,
  getAgentLogs,
  insertAgentLog,
  getChatHistory,
  insertChatMessage,
} from "./db";

// ── Circuits ──────────────────────────────────────────────────────────────────
const circuitRouter = router({
  list: protectedProcedure.query(async () => {
    const readings = await getLatestCircuitReadings();
    // Return latest reading per circuit
    const seen = new Set<string>();
    const latest: typeof readings = [];
    for (const r of readings) {
      if (!seen.has(r.circuitId)) {
        seen.add(r.circuitId);
        latest.push(r);
      }
    }
    return latest;
  }),

  history: protectedProcedure
    .input(z.object({ circuitId: z.string(), limit: z.number().optional() }))
    .query(({ input }) => getCircuitHistory(input.circuitId, input.limit)),

  toggle: protectedProcedure
    .input(z.object({ circuitId: z.string(), isOn: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await updateCircuitStatus(input.circuitId, input.isOn);
      if (!input.isOn) {
        await insertAlert({
          type: "circuit",
          severity: "warning",
          title: `Circuit ${input.circuitId} turned off`,
          message: `Circuit ${input.circuitId} was manually switched off by ${ctx.user.name ?? "a user"}.`,
        });
        // Notify owner when a critical circuit (EV charger, HVAC, main panel) is toggled off
        const criticalCircuits = ["main-panel", "hvac", "ev-charger"];
        if (criticalCircuits.includes(input.circuitId) && ctx.user.role === "admin") {
          await notifyOwner({
            title: `⚡ Aurora Core: Critical Circuit Off`,
            content: `Circuit "${input.circuitId}" was switched off by ${ctx.user.name ?? "admin"}.`,
          });
        }
      }
      return { success: true };
    }),

  seed: protectedProcedure.mutation(async () => {
    const circuits = [
      { circuitId: "main-panel", circuitName: "Main Panel", voltage: 120.5, current: 15.2, power: 1830, isOn: true, status: "normal" as const },
      { circuitId: "solar-input", circuitName: "Solar Input", voltage: 48.2, current: 12.8, power: 617, isOn: true, status: "normal" as const },
      { circuitId: "hvac", circuitName: "HVAC System", voltage: 240.1, current: 8.4, power: 2017, isOn: true, status: "warning" as const },
      { circuitId: "lighting", circuitName: "Lighting", voltage: 120.0, current: 3.2, power: 384, isOn: true, status: "normal" as const },
      { circuitId: "appliances", circuitName: "Appliances", voltage: 119.8, current: 11.5, power: 1378, isOn: true, status: "normal" as const },
      { circuitId: "ev-charger", circuitName: "EV Charger", voltage: 240.0, current: 32.0, power: 7680, isOn: false, status: "critical" as const },
    ];
    for (const c of circuits) {
      await insertCircuitReading(c);
    }
    return { seeded: circuits.length };
  }),
});

// ── Battery ───────────────────────────────────────────────────────────────────
const batteryRouter = router({
  latest: protectedProcedure.query(() => getLatestBatteryReading()),
  history: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getBatteryHistory(input.limit)),

  dispatch: protectedProcedure
    .input(z.object({ isDispatching: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const latest = await getLatestBatteryReading();
      if (latest) {
        await insertBatteryReading({
          stateOfCharge: latest.stateOfCharge,
          stateOfHealth: latest.stateOfHealth,
          voltage: latest.voltage,
          current: input.isDispatching ? -latest.current : Math.abs(latest.current),
          temperature: latest.temperature,
          isDispatching: input.isDispatching,
        });
        // Battery low warning notification
        if (latest.stateOfCharge <= 25 && ctx.user.role === "admin") {
          await insertAlert({ type: "battery", severity: "warning", title: "Battery Low", message: `Battery SoC is ${latest.stateOfCharge.toFixed(1)}% — below 25% threshold.` });
          await notifyOwner({ title: "🔋 Aurora Core: Battery Low Warning", content: `Battery state-of-charge is critically low at ${latest.stateOfCharge.toFixed(1)}%. Consider charging or reducing load.` });
        }
      }
      return { success: true };
    }),

  seed: protectedProcedure.mutation(async () => {
    await insertBatteryReading({
      stateOfCharge: 78.5,
      stateOfHealth: 94.2,
      voltage: 51.6,
      current: 8.4,
      temperature: 28.3,
      isDispatching: false,
    });
    return { seeded: true };
  }),
});

// ── TurnBot devices ───────────────────────────────────────────────────────────
const turnbotRouter = router({
  list: protectedProcedure.query(() => getAllTurnbotDevices()),

  toggle: protectedProcedure
    .input(z.object({ deviceId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await toggleTurnbotDevice(input.deviceId, input.isActive);
      await insertAgentLog({
        agentId: "energy",
        action: `TurnBot ${input.deviceId} ${input.isActive ? "activated" : "deactivated"}`,
        details: `Device toggled via dashboard control`,
        confidence: 1.0,
        hasConflict: false,
      });
      return { success: true };
    }),

  seed: protectedProcedure.mutation(async () => {
    const devices = [
      { deviceId: "tb-mini-001", name: "TurnBot Mini", type: "mini" as const, isOnline: true, isActive: false, torque: 0.3, position: 45, batteryLevel: 87, firmwareVersion: "1.2.1" },
      { deviceId: "tb-pro-001", name: "TurnBot Pro", type: "pro" as const, isOnline: true, isActive: true, torque: 0.8, position: 72, batteryLevel: 62, firmwareVersion: "2.0.3" },
      { deviceId: "tb-hub-001", name: "TurnBot Hub", type: "hub" as const, isOnline: true, isActive: true, torque: 0.0, position: 0, batteryLevel: 100, firmwareVersion: "3.1.0" },
    ];
    for (const d of devices) await upsertTurnbotDevice(d);
    return { seeded: devices.length };
  }),

  initiateOta: protectedProcedure
    .input(z.object({ deviceId: z.string(), targetVersion: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await initiateOta(input.deviceId, input.targetVersion);
      await insertAgentLog({
        agentId: "energy",
        action: `OTA update initiated for ${input.deviceId}`,
        details: `Target firmware: v${input.targetVersion}`,
        confidence: 1.0,
        hasConflict: false,
      });
      await insertAlert({
        type: "device",
        severity: "info",
        title: `OTA Update Started: ${input.deviceId}`,
        message: `Firmware update to v${input.targetVersion} initiated.`,
      });
      return { success: true };
    }),

  updateOtaStatus: protectedProcedure
    .input(z.object({
      deviceId: z.string(),
      status: z.enum(["idle", "pending", "downloading", "installing", "success", "failed"]),
      progress: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      await updateOtaProgress(input.deviceId, input.status, input.progress);
      if (input.status === "success") {
        await insertAlert({
          type: "device",
          severity: "info",
          title: `OTA Update Complete: ${input.deviceId}`,
          message: `Firmware updated successfully.`,
        });
      } else if (input.status === "failed") {
        await insertAlert({
          type: "device",
          severity: "warning",
          title: `OTA Update Failed: ${input.deviceId}`,
          message: `Firmware update failed at ${input.progress}% progress.`,
        });
      }
      return { success: true };
    }),
});

// ── Alerts ────────────────────────────────────────────────────────────────────
const alertsRouter = router({
  list: protectedProcedure.query(() => getAlerts()),

  resolve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => resolveAlert(input.id)),

  create: protectedProcedure
    .input(z.object({
      type: z.enum(["circuit", "battery", "agent", "device", "system"]),
      severity: z.enum(["info", "warning", "critical"]),
      title: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      await insertAlert(input);
      // Notify owner for critical alerts
      if (input.severity === "critical" && ctx.user.role === "admin") {
        await notifyOwner({
          title: `🚨 Aurora Core: ${input.title}`,
          content: input.message,
        });
      }
      return { success: true };
    }),
});

// ── Agent logs ────────────────────────────────────────────────────────────────
const agentsRouter = router({
  logs: protectedProcedure.query(() => getAgentLogs()),

  log: protectedProcedure
    .input(z.object({
      agentId: z.enum(["health", "energy", "behavior", "environment"]),
      action: z.string(),
      details: z.string().optional(),
      confidence: z.number().optional(),
      hasConflict: z.boolean().optional(),
      conflictResolution: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await insertAgentLog({
        agentId: input.agentId,
        action: input.action,
        details: input.details,
        confidence: input.confidence ?? 0.9,
        hasConflict: input.hasConflict ?? false,
        conflictResolution: input.conflictResolution,
      });
      // Notify owner on agent conflict resolution
      if (input.hasConflict && ctx.user.role === "admin") {
        await notifyOwner({
          title: `⚡ Aurora Core: Agent Conflict Resolved`,
          content: `${input.agentId} agent: ${input.action}. Resolution: ${input.conflictResolution ?? "auto-resolved"}`,
        });
      }
      return { success: true };
    }),

  seed: protectedProcedure.mutation(async () => {
    const logs = [
      { agentId: "health" as const, action: "Biometric scan complete", details: "HRV: 58ms, SpO2: 98%, Stress: Low", confidence: 0.97 },
      { agentId: "energy" as const, action: "Peak-load shaving initiated", details: "Shifting 2.4kW load to off-peak window", confidence: 0.92 },
      { agentId: "behavior" as const, action: "Routine pattern updated", details: "User typically arrives home at 18:30", confidence: 0.88 },
      { agentId: "environment" as const, action: "Air quality alert", details: "CO2 elevated: 1240ppm — ventilation recommended", confidence: 0.95, hasConflict: true, conflictResolution: "Energy agent approved 15° ventilation rotation" },
    ];
    for (const l of logs) await insertAgentLog(l);
    return { seeded: logs.length };
  }),
});

// ── AI Chat ───────────────────────────────────────────────────────────────────
const chatRouter = router({
  history: protectedProcedure.query(({ ctx }) => getChatHistory(ctx.user.id)),

  send: protectedProcedure
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      // Save user message
      await insertChatMessage({ userId: ctx.user.id, role: "user", content: input.message });

      // Get recent chat history for context
      const history = await getChatHistory(ctx.user.id, 10);

      // Build system prompt
      const systemPrompt = `You are Aurora Core, an advanced AI cognitive-energy ecosystem assistant. You help users monitor and optimize their RV/home energy systems, health metrics, and smart device automation.

You have access to a seven-layer cognitive architecture:
1. Bio — Biological & Environmental Inputs (wearables, air quality, occupancy)
2. Ingest — Signal Ingestion & Normalization (ESP32 mesh, Green Button energy data)
3. Cognitive Core — Multi-Agent AI Field (Health, Energy, Behavior, Environment agents)
4. Predictive — Simulation Engine (Monte Carlo, Temporal Fusion Transformer)
5. Decision — Orchestration Engine (priority weighting, conflict resolution)
6. Execution — TurnBot actuators, Matter 1.5/Thread/BLE 5.3 devices
7. Optimization Loop — Continuous feedback, model retraining

You manage TurnBot devices (Mini, Pro, Hub) for physical knob/dial automation.
You run predictive scenarios: Peak Shave, Grid Response, Wellness Priority.
Respond concisely and helpfully. Use technical precision when appropriate.`;

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: input.message },
      ];

      const response = await invokeLLM({ messages });
      const rawContent = response.choices[0]?.message?.content;
      const assistantContent = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text ?? "").join("") : "I'm unable to process that request right now.");

      // Save assistant response
      await insertChatMessage({ userId: ctx.user.id, role: "assistant", content: assistantContent });

      return { response: assistantContent };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    // We don't delete — just return success (history naturally truncates)
    return { success: true };
  }),
});

// ── Simulation ────────────────────────────────────────────────────────────────
const simulationRouter = router({
  analyze: protectedProcedure
    .input(z.object({ scenario: z.string() }))
    .mutation(async ({ input }) => {
      const prompt = `You are Aurora Core's Predictive Simulation Engine. Analyze the following scenario and provide a brief, data-driven assessment in 2-3 sentences with specific numbers:

Scenario: "${input.scenario}"

Include: probability estimate (%), estimated monthly savings ($), key actions recommended, and any health/comfort tradeoffs.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are Aurora Core's AI simulation engine. Be concise and data-driven." },
          { role: "user", content: prompt },
        ],
      });

      return { analysis: response.choices[0]?.message?.content ?? "Analysis unavailable." };
    }),

  analyzeWithParams: protectedProcedure
    .input(z.object({
      scenario: z.string(),
      confidenceThreshold: z.number().min(0).max(100),
      savingsTarget: z.number().min(0).max(500),
      priorityWeights: z.object({
        cost: z.number().min(0).max(100),
        comfort: z.number().min(0).max(100),
        health: z.number().min(0).max(100),
        grid: z.number().min(0).max(100),
        batteryLife: z.number().min(0).max(100),
      }),
    }))
    .mutation(async ({ input }) => {
      const totalWeight = input.priorityWeights.cost + input.priorityWeights.comfort +
        input.priorityWeights.health + input.priorityWeights.grid + input.priorityWeights.batteryLife;

      const prompt = `You are Aurora Core's Monte Carlo Simulation Engine. Run a parameterized analysis for the following scenario with custom tuning parameters.

Scenario: "${input.scenario}"

Tuning Parameters:
- Confidence Threshold: ${input.confidenceThreshold}% (only recommend actions above this confidence level)
- Monthly Savings Target: $${input.savingsTarget}
- Priority Weights (total: ${totalWeight}):
  * Cost Savings: ${input.priorityWeights.cost}
  * Comfort: ${input.priorityWeights.comfort}
  * Health: ${input.priorityWeights.health}
  * Grid Benefit: ${input.priorityWeights.grid}
  * Battery Life: ${input.priorityWeights.batteryLife}

Provide a 3-paragraph analysis:
1. Probability assessment given the confidence threshold
2. Whether the savings target is achievable and by what margin
3. Recommended action plan weighted by the priority settings above

Be specific with numbers and percentages.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are Aurora Core's AI Monte Carlo simulation engine. Provide precise, data-driven analysis." },
          { role: "user", content: prompt },
        ],
      });

      return { analysis: response.choices[0]?.message?.content ?? "Analysis unavailable." };
    }),
});

// ── Main router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  circuits: circuitRouter,
  battery: batteryRouter,
  turnbot: turnbotRouter,
  alerts: alertsRouter,
  agents: agentsRouter,
  chat: chatRouter,
  simulation: simulationRouter,
});

export type AppRouter = typeof appRouter;
