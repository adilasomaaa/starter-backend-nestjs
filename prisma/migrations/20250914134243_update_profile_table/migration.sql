-- AlterTable
ALTER TABLE `Profile` MODIFY `bio` VARCHAR(191) NULL,
    MODIFY `photo` VARCHAR(191) NOT NULL DEFAULT 'default.png';
