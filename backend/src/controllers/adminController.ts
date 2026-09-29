import { Response } from 'express';
import * as argon2 from 'argon2';
import { query } from '../db';
import { AuthRequest } from '../middlewares/auth';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, username, email, role, is_active, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body;
  
  if (!username || !email || !password || !role) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await query(
      'INSERT INTO users (id, username, email, password_hash, role, must_change_password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role',
      [crypto.randomUUID(), username, email, passwordHash, role, true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_active, role, force_password_reset } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIdx++}`);
      values.push(is_active);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIdx++}`);
      values.push(role);
    }
    if (force_password_reset === true) {
      updates.push(`must_change_password = $${paramIdx++}`);
      values.push(true);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);
    const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, username, role, is_active`;
    
    const result = await query(queryStr, values);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }

  try {
    // 1. Soft delete user
    const userResult = await query(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP, is_active = false, username = id::varchar, email = id::varchar WHERE id = $1 RETURNING id',
      [id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 2. Cascade soft delete or anonymization for financial records
    await query('UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1', [id]);
    await query('UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
