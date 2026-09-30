-- 004_create_accounts.sql
-- Creates accounts table and links it to transactions

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('CASH', 'BANK', 'CREDIT_CARD')),
  balance NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE transactions
DROP COLUMN IF EXISTS payment_method;

ALTER TABLE transactions
ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
ADD COLUMN destination_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
