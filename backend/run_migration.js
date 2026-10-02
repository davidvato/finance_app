const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://finance_user:finance_password@localhost:5432/finance_db',
});

async function runMigration() {
  try {
    const sql = fs.readFileSync('./db/migrations/006_account_exclude_from_balance.sql', 'utf8');
    await pool.query(sql);
    console.log('Migration 005 ran successfully');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
