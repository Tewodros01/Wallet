DROP TABLE IF EXISTS "PaymentRequest";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentRequestStatus') THEN
    DROP TYPE "PaymentRequestStatus";
  END IF;
END $$;
