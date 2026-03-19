/*
  Warnings:

  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Category` MODIFY `type` ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'GAME_ENTRY', 'GAME_WIN', 'AGENT_COMMISSION', 'REFERRAL_BONUS') NOT NULL;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `gameRoomId` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('INCOME', 'EXPENSE', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'GAME_ENTRY', 'GAME_WIN', 'AGENT_COMMISSION', 'REFERRAL_BONUS') NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `coinsBalance` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `referredById` VARCHAR(191) NULL,
    MODIFY `role` ENUM('USER', 'AGENT', 'ADMIN') NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `Wallet` MODIFY `currency` ENUM('USD', 'EUR', 'GBP', 'ETB') NOT NULL DEFAULT 'ETB';

-- CreateTable
CREATE TABLE `GameRoom` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `hostId` VARCHAR(191) NOT NULL,
    `status` ENUM('WAITING', 'PLAYING', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `speed` ENUM('SLOW', 'NORMAL', 'FAST') NOT NULL DEFAULT 'NORMAL',
    `entryFee` INTEGER NOT NULL DEFAULT 0,
    `prizePool` INTEGER NOT NULL DEFAULT 0,
    `maxPlayers` INTEGER NOT NULL DEFAULT 50,
    `cardsPerPlayer` INTEGER NOT NULL DEFAULT 1,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `password` VARCHAR(191) NULL,
    `winnerId` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GameRoom_hostId_idx`(`hostId`),
    INDEX `GameRoom_status_idx`(`status`),
    INDEX `GameRoom_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomPlayer` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('JOINED', 'PLAYING', 'WON', 'LOST', 'LEFT') NOT NULL DEFAULT 'JOINED',
    `cardId` VARCHAR(191) NULL,
    `markedNums` JSON NOT NULL,
    `hasBingo` BOOLEAN NOT NULL DEFAULT false,
    `prize` INTEGER NOT NULL DEFAULT 0,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,

    INDEX `RoomPlayer_roomId_idx`(`roomId`),
    INDEX `RoomPlayer_userId_idx`(`userId`),
    UNIQUE INDEX `RoomPlayer_roomId_userId_key`(`roomId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BingoCard` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `board` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BingoCard_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameRound` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `calledNums` JSON NOT NULL,
    `currentNum` INTEGER NULL,
    `roundNumber` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GameRound_roomId_idx`(`roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deposit` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `method` ENUM('TELEBIRR', 'CBE_BIRR', 'BANK_CARD') NOT NULL,
    `reference` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `failureReason` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Deposit_reference_key`(`reference`),
    INDEX `Deposit_userId_idx`(`userId`),
    INDEX `Deposit_status_idx`(`status`),
    INDEX `Deposit_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Withdrawal` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `method` ENUM('TELEBIRR', 'CBE_BIRR', 'BANK_CARD') NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `failureReason` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Withdrawal_userId_idx`(`userId`),
    INDEX `Withdrawal_status_idx`(`status`),
    INDEX `Withdrawal_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentInvite` (
    `id` VARCHAR(191) NOT NULL,
    `inviterId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'PENDING',
    `commission` INTEGER NOT NULL DEFAULT 0,
    `usedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AgentInvite_code_key`(`code`),
    INDEX `AgentInvite_inviterId_idx`(`inviterId`),
    INDEX `AgentInvite_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tournament` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `prize` INTEGER NOT NULL DEFAULT 0,
    `entryFee` INTEGER NOT NULL DEFAULT 0,
    `maxPlayers` INTEGER NOT NULL DEFAULT 100,
    `status` ENUM('UPCOMING', 'LIVE', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `sponsored` VARCHAR(191) NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Tournament_status_idx`(`status`),
    INDEX `Tournament_startsAt_idx`(`startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TournamentPlayer` (
    `id` VARCHAR(191) NOT NULL,
    `tournamentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TournamentPlayer_tournamentId_idx`(`tournamentId`),
    INDEX `TournamentPlayer_userId_idx`(`userId`),
    UNIQUE INDEX `TournamentPlayer_tournamentId_userId_key`(`tournamentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mission` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `reward` INTEGER NOT NULL,
    `total` INTEGER NOT NULL DEFAULT 1,
    `type` ENUM('DAILY', 'WEEKLY') NOT NULL,
    `category` ENUM('PLAY_GAMES', 'WIN_GAMES', 'DEPOSIT', 'INVITE', 'TOURNAMENT', 'KENO') NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '🎯',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `resetAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Mission_type_idx`(`type`),
    INDEX `Mission_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMission` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `missionId` VARCHAR(191) NOT NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `claimed` BOOLEAN NOT NULL DEFAULT false,
    `claimedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserMission_userId_idx`(`userId`),
    INDEX `UserMission_missionId_idx`(`missionId`),
    UNIQUE INDEX `UserMission_userId_missionId_key`(`userId`, `missionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('WIN', 'DEPOSIT', 'INVITE', 'TOURNAMENT', 'SYSTEM', 'MISSION', 'WITHDRAWAL', 'TRANSFER') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_read_idx`(`read`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transaction_userId_idx` ON `Transaction`(`userId`);

-- CreateIndex
CREATE INDEX `Transaction_gameRoomId_idx` ON `Transaction`(`gameRoomId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_referredById_fkey` FOREIGN KEY (`referredById`) REFERENCES `AgentInvite`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_gameRoomId_fkey` FOREIGN KEY (`gameRoomId`) REFERENCES `GameRoom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameRoom` ADD CONSTRAINT `GameRoom_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomPlayer` ADD CONSTRAINT `RoomPlayer_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `GameRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomPlayer` ADD CONSTRAINT `RoomPlayer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomPlayer` ADD CONSTRAINT `RoomPlayer_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `BingoCard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BingoCard` ADD CONSTRAINT `BingoCard_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameRound` ADD CONSTRAINT `GameRound_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `GameRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deposit` ADD CONSTRAINT `Deposit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Withdrawal` ADD CONSTRAINT `Withdrawal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentInvite` ADD CONSTRAINT `AgentInvite_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentPlayer` ADD CONSTRAINT `TournamentPlayer_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMission` ADD CONSTRAINT `UserMission_missionId_fkey` FOREIGN KEY (`missionId`) REFERENCES `Mission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
