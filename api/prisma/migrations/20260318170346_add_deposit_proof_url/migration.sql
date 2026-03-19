-- AlterTable
ALTER TABLE `Deposit` ADD COLUMN `proofUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `Mission` MODIFY `icon` VARCHAR(191) NOT NULL DEFAULT '🎯';
