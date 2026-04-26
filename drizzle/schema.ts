import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Circuit readings table
export const circuitReadings = mysqlTable("circuit_readings", {
  id: int("id").autoincrement().primaryKey(),
  circuitId: varchar("circuitId", { length: 64 }).notNull(),
  circuitName: varchar("circuitName", { length: 128 }).notNull(),
  voltage: float("voltage").notNull(),
  current: float("current").notNull(),
  power: float("power").notNull(),
  isOn: boolean("isOn").default(true).notNull(),
  status: mysqlEnum("status", ["normal", "warning", "critical"]).default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CircuitReading = typeof circuitReadings.$inferSelect;
export type InsertCircuitReading = typeof circuitReadings.$inferInsert;

// Battery readings table
export const batteryReadings = mysqlTable("battery_readings", {
  id: int("id").autoincrement().primaryKey(),
  stateOfCharge: float("stateOfCharge").notNull(),
  stateOfHealth: float("stateOfHealth").notNull(),
  voltage: float("voltage").notNull(),
  current: float("current").notNull(),
  temperature: float("temperature").notNull(),
  isDispatching: boolean("isDispatching").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BatteryReading = typeof batteryReadings.$inferSelect;
export type InsertBatteryReading = typeof batteryReadings.$inferInsert;

// TurnBot devices table
export const turnbotDevices = mysqlTable("turnbot_devices", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["mini", "pro", "hub"]).notNull(),
  isOnline: boolean("isOnline").default(true).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  torque: float("torque").default(0).notNull(),
  position: float("position").default(0).notNull(),
  batteryLevel: float("batteryLevel").default(100).notNull(),
  firmwareVersion: varchar("firmwareVersion", { length: 32 }).default("1.0.0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TurnbotDevice = typeof turnbotDevices.$inferSelect;
export type InsertTurnbotDevice = typeof turnbotDevices.$inferInsert;

// Alert history table
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["circuit", "battery", "agent", "device", "system"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistoryItem = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

// AI agent activity logs table
export const agentActivityLogs = mysqlTable("agent_activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  agentId: mysqlEnum("agentId", ["health", "energy", "behavior", "environment"]).notNull(),
  action: varchar("action", { length: 256 }).notNull(),
  details: text("details"),
  confidence: float("confidence").default(0.9).notNull(),
  hasConflict: boolean("hasConflict").default(false).notNull(),
  conflictResolution: text("conflictResolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentActivityLog = typeof agentActivityLogs.$inferSelect;
export type InsertAgentActivityLog = typeof agentActivityLogs.$inferInsert;

// Chat messages table
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
