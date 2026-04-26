CREATE TABLE `agent_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` enum('health','energy','behavior','environment') NOT NULL,
	`action` varchar(256) NOT NULL,
	`details` text,
	`confidence` float NOT NULL DEFAULT 0.9,
	`hasConflict` boolean NOT NULL DEFAULT false,
	`conflictResolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('circuit','battery','agent','device','system') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`isResolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `battery_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stateOfCharge` float NOT NULL,
	`stateOfHealth` float NOT NULL,
	`voltage` float NOT NULL,
	`current` float NOT NULL,
	`temperature` float NOT NULL,
	`isDispatching` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `battery_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `circuit_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circuitId` varchar(64) NOT NULL,
	`circuitName` varchar(128) NOT NULL,
	`voltage` float NOT NULL,
	`current` float NOT NULL,
	`power` float NOT NULL,
	`isOn` boolean NOT NULL DEFAULT true,
	`status` enum('normal','warning','critical') NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `circuit_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `turnbot_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('mini','pro','hub') NOT NULL,
	`isOnline` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT false,
	`torque` float NOT NULL DEFAULT 0,
	`position` float NOT NULL DEFAULT 0,
	`batteryLevel` float NOT NULL DEFAULT 100,
	`firmwareVersion` varchar(32) NOT NULL DEFAULT '1.0.0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `turnbot_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `turnbot_devices_deviceId_unique` UNIQUE(`deviceId`)
);
