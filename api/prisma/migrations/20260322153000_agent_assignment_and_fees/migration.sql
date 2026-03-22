ALTER TABLE "Deposit"
ADD COLUMN "agentId" TEXT;

ALTER TABLE "Withdrawal"
ADD COLUMN "agentId" TEXT,
ADD COLUMN "feeAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "payoutAmount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Deposit_agentId_idx" ON "Deposit"("agentId");
CREATE INDEX "Withdrawal_agentId_idx" ON "Withdrawal"("agentId");

ALTER TABLE "Deposit"
ADD CONSTRAINT "Deposit_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Withdrawal"
ADD CONSTRAINT "Withdrawal_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Withdrawal"
SET "payoutAmount" = "amount"
WHERE "payoutAmount" = 0;
