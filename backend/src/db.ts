import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://finance_user:finance_password@localhost:5432/finance_db',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
