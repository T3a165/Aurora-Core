ALTER TABLE `turnbot_devices` ADD `otaStatus` enum('idle','pending','downloading','installing','success','failed') DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE `turnbot_devices` ADD `otaProgress` float DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `turnbot_devices` ADD `otaTargetVersion` varchar(32);--> statement-breakpoint
ALTER TABLE `turnbot_devices` ADD `otaStartedAt` timestamp;