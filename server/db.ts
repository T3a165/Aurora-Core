import { desc, eq, and, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  circuitReadings,
  batteryReadings,
  turnbotDevices,
  alertHistory,
  agentActivityLogs,
  chatMessages,
  InsertCircuitReading,
  InsertBatteryReading,
  InsertTurnbotDevice,
  InsertAlertHistory,
  InsertAgentActivityLog,
  InsertChatMessage,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Circuit readings ──────────────────────────────────────────────────────────

export async function insertCircuitReading(data: InsertCircuitReading) {
  const db = await getDb();
  if (!db) return;
  await db.insert(circuitReadings).values(data);
}

export async function getLatestCircuitReadings() {
  const db = await getDb();
  if (!db) return [];
  // Get the latest reading per circuit
  return db
    .select()
    .from(circuitReadings)
    .orderBy(desc(circuitReadings.createdAt))
    .limit(50);
}

export async function getCircuitHistory(circuitId: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(circuitReadings)
    .where(eq(circuitReadings.circuitId, circuitId))
    .orderBy(desc(circuitReadings.createdAt))
    .limit(limit);
}

export async function updateCircuitStatus(circuitId: string, isOn: boolean) {
  const db = await getDb();
  if (!db) return;
  // Insert a new reading reflecting the toggle
  const latest = await db
    .select()
    .from(circuitReadings)
    .where(eq(circuitReadings.circuitId, circuitId))
    .orderBy(desc(circuitReadings.createdAt))
    .limit(1);
  if (latest[0]) {
    await db.insert(circuitReadings).values({ ...latest[0], id: undefined, isOn, createdAt: undefined });
  }
}

// ── Battery readings ──────────────────────────────────────────────────────────

export async function insertBatteryReading(data: InsertBatteryReading) {
  const db = await getDb();
  if (!db) return;
  await db.insert(batteryReadings).values(data);
}

export async function getLatestBatteryReading() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(batteryReadings).orderBy(desc(batteryReadings.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function getBatteryHistory(limit = 24) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batteryReadings).orderBy(desc(batteryReadings.createdAt)).limit(limit);
}

// ── TurnBot devices ───────────────────────────────────────────────────────────

export async function getAllTurnbotDevices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(turnbotDevices).orderBy(turnbotDevices.type);
}

export async function upsertTurnbotDevice(data: InsertTurnbotDevice) {
  const db = await getDb();
  if (!db) return;
  await db.insert(turnbotDevices).values(data).onDuplicateKeyUpdate({
    set: {
      isOnline: data.isOnline,
      isActive: data.isActive,
      torque: data.torque,
      position: data.position,
      batteryLevel: data.batteryLevel,
    },
  });
}

export async function toggleTurnbotDevice(deviceId: string, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(turnbotDevices).set({ isActive }).where(eq(turnbotDevices.deviceId, deviceId));
}

export async function initiateOta(deviceId: string, targetVersion: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(turnbotDevices)
    .set({ otaStatus: "pending", otaProgress: 0, otaTargetVersion: targetVersion, otaStartedAt: new Date() })
    .where(eq(turnbotDevices.deviceId, deviceId));
}

export async function updateOtaProgress(deviceId: string, status: "idle" | "pending" | "downloading" | "installing" | "success" | "failed", progress: number) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { otaStatus: status, otaProgress: progress };
  if (status === "success") {
    // On success, promote otaTargetVersion to firmwareVersion
    const device = await db.select().from(turnbotDevices).where(eq(turnbotDevices.deviceId, deviceId)).limit(1);
    if (device[0]?.otaTargetVersion) {
      updateData.firmwareVersion = device[0].otaTargetVersion;
      updateData.otaTargetVersion = null;
    }
  }
  if (status === "idle" || status === "success" || status === "failed") {
    updateData.otaProgress = status === "success" ? 100 : progress;
  }
  await db.update(turnbotDevices).set(updateData as any).where(eq(turnbotDevices.deviceId, deviceId));
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function insertAlert(data: InsertAlertHistory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(alertHistory).values(data);
  return result;
}

export async function getAlerts(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertHistory).orderBy(desc(alertHistory.createdAt)).limit(limit);
}

export async function resolveAlert(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alertHistory).set({ isResolved: true, resolvedAt: new Date() }).where(eq(alertHistory.id, id));
}

// ── Agent activity logs ───────────────────────────────────────────────────────

export async function insertAgentLog(data: InsertAgentActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(agentActivityLogs).values(data);
}

export async function getAgentLogs(limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentActivityLogs).orderBy(desc(agentActivityLogs.createdAt)).limit(limit);
}

// ── Chat messages ─────────────────────────────────────────────────────────────

export async function insertChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values(data);
}

export async function getChatHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}
