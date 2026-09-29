-- Migration 002: Add type and budget to categories, and support transaction updates
-- Run this in your Neon SQL Editor or via psql

-- Add 'type' column to categories (EXPENSE or INCOME)
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS type VARCHAR(10) NOT NULL DEFAULT 'EXPENSE'
  CHECK (type IN ('EXPENSE', 'INCOME'));

-- Add 'budget_amount' column to categories (optional monthly budget for this category)
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(12, 2) DEFAULT NULL;

-- Update updated_at trigger if not already set
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure trigger exists on categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure trigger exists on transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
