import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middlewares/auth';
import * as crypto from 'crypto';

export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT a.id, a.name, a.type, a.cutoff_day, a.exclude_from_balance, a.created_at, a.updated_at,
        a.balance + COALESCE(
          (SELECT SUM(
            CASE 
              WHEN t.type = 'INCOME' AND t.account_id = a.id THEN t.amount 
              WHEN t.type = 'EXPENSE' AND t.account_id = a.id THEN -t.amount 
              WHEN t.type = 'TRANSFER' AND t.destination_account_id = a.id THEN t.amount 
              WHEN t.type = 'TRANSFER' AND t.account_id = a.id THEN -t.amount 
              ELSE 0 
            END
          ) 
          FROM transactions t 
          WHERE (t.account_id = a.id OR t.destination_account_id = a.id) AND t.deleted_at IS NULL), 0
        ) as balance
       FROM accounts a 
       WHERE a.user_id = $1 
       ORDER BY a.name ASC`,
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, balance = 0.00, exclude_from_balance = false, cutoff_day = null } = req.body;
  if (!name || !type) { res.status(400).json({ error: 'Name and type are required' }); return; }
  const parsedCutoff = type === 'CREDIT_CARD' && cutoff_day !== undefined && cutoff_day !== null && cutoff_day !== ''
    ? parseInt(cutoff_day, 10)
    : null;
  try {
    const result = await query(
      'INSERT INTO accounts (id, user_id, name, type, balance, exclude_from_balance, cutoff_day) VALUES ($1, $2, $3, $4, $5, $6, $7::INTEGER) RETURNING *',
      [crypto.randomUUID(), req.user?.id, name, type, balance, exclude_from_balance, parsedCutoff]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, type, balance, exclude_from_balance, cutoff_day } = req.body;
  const parsedCutoff = type === 'CREDIT_CARD' && cutoff_day !== undefined && cutoff_day !== null && cutoff_day !== ''
    ? parseInt(cutoff_day, 10)
    : null;
  try {
    const result = await query(
      `UPDATE accounts 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           balance = COALESCE($3, balance),
           exclude_from_balance = COALESCE($4, exclude_from_balance),
           cutoff_day = $5::INTEGER,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, type, balance, exclude_from_balance ?? null, parsedCutoff, id, req.user?.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Account not found' }); return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user?.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Account not found' }); return;
    }
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
