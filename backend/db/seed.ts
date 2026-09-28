import { Client } from 'pg';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const seed = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://finance_user:finance_password@localhost:5432/finance_db',
  });

  try {
    await client.connect();
    
    // Hash password 'qwerty' with argon2
    // argon2 handles salt generation automatically (16 bytes by default in most implementations, highly secure)
    const passwordHash = await argon2.hash('qwerty', {
        type: argon2.argon2id
    });

    const query = `
      INSERT INTO users (username, email, password_hash, role, must_change_password)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
    `;
    const values = ['admin', 'admin@finance.app', passwordHash, 'ADMIN', true];
    
    await client.query(query, values);
    console.log('Seed executed successfully: Admin user created.');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
};

seed();
