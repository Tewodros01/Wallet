-- Add MPESA payment method
ALTER TYPE "PaymentMethod" ADD VALUE 'MPESA';

-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('MOBILE_WALLET', 'BANK_ACCOUNT');

-- CreateEnum
CREATE TYPE "FinancialAccountProvider" AS ENUM ('TELEBIRR', 'MPESA', 'CBE_BIRR', 'BOA', 'OTHER_BANK', 'OTHER_WALLET');

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "FinancialAccountType" NOT NULL,
    "provider" "FinancialAccountProvider" NOT NULL,
    "accountName" TEXT,
    "accountNumber" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- Migrate Telebirr accounts
INSERT INTO "FinancialAccount" (
    "id",
    "userId",
    "type",
    "provider",
    "accountNumber",
    "label",
    "isDefault",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    "id" || '_telebirr',
    "id",
    'MOBILE_WALLET'::"FinancialAccountType",
    'TELEBIRR'::"FinancialAccountProvider",
    "telebirrAccount",
    'Telebirr',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "telebirrAccount" IS NOT NULL;

-- Migrate CBE Birr accounts
INSERT INTO "FinancialAccount" (
    "id",
    "userId",
    "type",
    "provider",
    "accountNumber",
    "label",
    "isDefault",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    "id" || '_cbe_birr',
    "id",
    'MOBILE_WALLET'::"FinancialAccountType",
    'CBE_BIRR'::"FinancialAccountProvider",
    "cbeBirrAccount",
    'CBE Birr',
    CASE WHEN "telebirrAccount" IS NULL THEN true ELSE false END,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "cbeBirrAccount" IS NOT NULL;

-- Migrate BOA accounts
INSERT INTO "FinancialAccount" (
    "id",
    "userId",
    "type",
    "provider",
    "accountNumber",
    "label",
    "isDefault",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    "id" || '_boa',
    "id",
    'BANK_ACCOUNT'::"FinancialAccountType",
    'BOA'::"FinancialAccountProvider",
    "boaAccountNumber",
    'BOA',
    CASE
        WHEN "telebirrAccount" IS NULL AND "cbeBirrAccount" IS NULL THEN true
        ELSE false
    END,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "boaAccountNumber" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_userId_provider_accountNumber_key" ON "FinancialAccount"("userId", "provider", "accountNumber");

-- CreateIndex
CREATE INDEX "FinancialAccount_userId_idx" ON "FinancialAccount"("userId");

-- CreateIndex
CREATE INDEX "FinancialAccount_type_idx" ON "FinancialAccount"("type");

-- CreateIndex
CREATE INDEX "FinancialAccount_provider_idx" ON "FinancialAccount"("provider");

-- CreateIndex
CREATE INDEX "FinancialAccount_isDefault_idx" ON "FinancialAccount"("isDefault");

-- CreateIndex
CREATE INDEX "FinancialAccount_isActive_idx" ON "FinancialAccount"("isActive");

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove old in-user account columns
ALTER TABLE "User"
DROP COLUMN "telebirrAccount",
DROP COLUMN "cbeBirrAccount",
DROP COLUMN "boaAccountNumber";
