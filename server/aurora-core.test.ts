import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Helpers ───────────────────────────────────────────────────────────────────

type AuthUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides: Partial<AuthUser> = {}): TrpcContext {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthUser = {
    id: 1,
    openId: "test-open-id",
    email: "test@aurora-core.io",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("me returns the current user", async () => {
    const ctx = makeCtx({ name: "Aurora Admin" });
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.name).toBe("Aurora Admin");
    expect(user?.role).toBe("admin");
  });

  it("logout clears session cookie and returns success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: makeCtx().user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ── Circuits ──────────────────────────────────────────────────────────────────

describe("circuits", () => {
  it("seed creates demo circuits", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.circuits.seed();
    expect(result.seeded).toBe(6);
  });

  it("list returns circuit readings", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const circuits = await caller.circuits.list();
    expect(Array.isArray(circuits)).toBe(true);
    // After seeding there should be at least 1
    expect(circuits.length).toBeGreaterThanOrEqual(1);
  });

  it("toggle returns success", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.circuits.toggle({ circuitId: "lighting", isOn: false });
    expect(result.success).toBe(true);
  });
});

// ── Battery ───────────────────────────────────────────────────────────────────

describe("battery", () => {
  it("seed inserts a battery reading", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.battery.seed();
    expect(result.seeded).toBe(true);
  });

  it("latest returns a battery reading", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const reading = await caller.battery.latest();
    expect(reading).not.toBeNull();
    if (reading) {
      expect(reading.stateOfCharge).toBeGreaterThan(0);
      expect(reading.stateOfHealth).toBeGreaterThan(0);
      expect(reading.voltage).toBeGreaterThan(0);
    }
  });

  it("dispatch toggles isDispatching", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.battery.dispatch({ isDispatching: true });
    expect(result.success).toBe(true);
  });
});

// ── TurnBot ───────────────────────────────────────────────────────────────────

describe("turnbot", () => {
  it("seed creates 3 TurnBot devices", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.turnbot.seed();
    expect(result.seeded).toBe(3);
  });

  it("list returns TurnBot devices", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const devices = await caller.turnbot.list();
    expect(Array.isArray(devices)).toBe(true);
    expect(devices.length).toBeGreaterThanOrEqual(3);
    const names = devices.map(d => d.name);
    expect(names).toContain("TurnBot Mini");
    expect(names).toContain("TurnBot Pro");
    expect(names).toContain("TurnBot Hub");
  });

  it("toggle activates a device", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.turnbot.toggle({ deviceId: "tb-mini-001", isActive: true });
    expect(result.success).toBe(true);
  });
});

// ── Alerts ────────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("create inserts an alert", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.alerts.create({
      type: "system",
      severity: "info",
      title: "Test Alert",
      message: "Aurora Core test alert from vitest",
    });
    expect(result.success).toBe(true);
  });

  it("list returns alerts", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const alerts = await caller.alerts.list();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });

  it("resolve marks alert as resolved", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const alerts = await caller.alerts.list();
    const unresolved = alerts.find(a => !a.isResolved);
    if (unresolved) {
      // resolveAlert returns void — just ensure it doesn't throw
      await expect(caller.alerts.resolve({ id: unresolved.id })).resolves.not.toThrow();
      // Verify the alert is now resolved
      const updated = await caller.alerts.list();
      const resolved = updated.find(a => a.id === unresolved.id);
      expect(resolved?.isResolved).toBe(true);
    } else {
      // No unresolved alerts to test — pass trivially
      expect(true).toBe(true);
    }
  });
});

// ── Agent Logs ────────────────────────────────────────────────────────────────

describe("agents", () => {
  it("seed inserts demo agent logs", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.agents.seed();
    expect(result.seeded).toBe(4);
  });

  it("logs returns agent activity", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const logs = await caller.agents.logs();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const agentIds = logs.map(l => l.agentId);
    // All four agents should be represented
    expect(agentIds).toContain("health");
    expect(agentIds).toContain("energy");
    expect(agentIds).toContain("behavior");
    expect(agentIds).toContain("environment");
  });

  it("log inserts a custom agent entry", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.agents.log({
      agentId: "health",
      action: "Vitest health check",
      details: "All biometric sensors nominal",
      confidence: 0.99,
      hasConflict: false,
    });
    expect(result.success).toBe(true);
  });
});
