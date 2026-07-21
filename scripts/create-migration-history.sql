CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(191) NOT NULL,
  `checksum` VARCHAR(191) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  `migration_name` VARCHAR(191) NOT NULL,
  `logs` TEXT NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `started_at`, `applied_steps_count`)
VALUES ('20260708000000_init', 'manual', NOW(), '20260708000000_init', NULL, NOW(), 1);
