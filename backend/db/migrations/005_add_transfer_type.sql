-- 005_add_transfer_type.sql
-- Drop the existing constraint and add TRANSFER to the valid types

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check CHECK (type IN ('EXPENSE', 'INCOME', 'TRANSFER'));
