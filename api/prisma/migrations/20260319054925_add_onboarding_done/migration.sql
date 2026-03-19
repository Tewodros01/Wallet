-- AlterTable
ALTER TABLE `Mission` MODIFY `icon` VARCHAR(191) NOT NULL DEFAULT '🎯';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `onboardingDone` BOOLEAN NOT NULL DEFAULT false;
