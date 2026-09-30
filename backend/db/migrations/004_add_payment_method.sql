-- 004_add_payment_method.sql
-- Adds payment_method column to the transactions table

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)
  DEFAULT 'CASH'
  CHECK (payment_method IN ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER'));
