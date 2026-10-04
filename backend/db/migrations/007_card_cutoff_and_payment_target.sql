-- 007_card_cutoff_and_payment_target.sql
-- Add cutoff_day to accounts for credit cards
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS cutoff_day INTEGER CHECK (cutoff_day >= 1 AND cutoff_day <= 31);

-- Add payment_target_cycle to transactions for payments/transfers to credit cards
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS payment_target_cycle VARCHAR(20) DEFAULT NULL 
CHECK (payment_target_cycle IS NULL OR payment_target_cycle IN ('CURRENT', 'PREVIOUS'));
