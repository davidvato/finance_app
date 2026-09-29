-- Migration 003: Add budget_start_day to users
-- Run this in your Neon SQL Editor or via psql

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS budget_start_day INTEGER NOT NULL DEFAULT 1
  CHECK (budget_start_day >= 1 AND budget_start_day <= 31);
