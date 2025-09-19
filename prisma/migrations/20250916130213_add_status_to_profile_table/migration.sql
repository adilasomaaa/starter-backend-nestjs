-- AlterTable
ALTER TABLE `Profile` ADD COLUMN `status` ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active';
