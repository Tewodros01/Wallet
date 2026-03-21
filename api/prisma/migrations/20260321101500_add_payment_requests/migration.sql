CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED');

CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "payerId" TEXT,
    "amount" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "merchantLabel" TEXT,
    "note" TEXT,
    "reference" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentRequest_reference_key" ON "PaymentRequest"("reference");
CREATE INDEX "PaymentRequest_creatorId_idx" ON "PaymentRequest"("creatorId");
CREATE INDEX "PaymentRequest_payerId_idx" ON "PaymentRequest"("payerId");
CREATE INDEX "PaymentRequest_status_idx" ON "PaymentRequest"("status");
CREATE INDEX "PaymentRequest_createdAt_idx" ON "PaymentRequest"("createdAt");
CREATE INDEX "PaymentRequest_expiresAt_idx" ON "PaymentRequest"("expiresAt");

ALTER TABLE "PaymentRequest"
ADD CONSTRAINT "PaymentRequest_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentRequest"
ADD CONSTRAINT "PaymentRequest_payerId_fkey"
FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
