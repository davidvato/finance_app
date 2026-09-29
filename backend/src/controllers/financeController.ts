import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middlewares/auth';

// Categories
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // IDOR Protection: Query restricted by user_id
    const result = await query('SELECT * FROM categories WHERE user_id = $1 AND deleted_at IS NULL', [req.user?.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, color_hex, icon_name } = req.body;
  try {
    const result = await query(
      'INSERT INTO categories (id, user_id, name, color_hex, icon_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [crypto.randomUUID(), req.user?.id, name, color_hex, icon_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Transactions
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // IDOR Protection: Query restricted by user_id
    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 AND deleted_at IS NULL ORDER BY transaction_date DESC', 
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, category_id, amount, type, description, transaction_date } = req.body;
  
  // Use client ID if provided (for offline sync) or generate a new one
  const txId = id || uuidv4();

  try {
    const result = await query(
      `INSERT INTO transactions (id, user_id, category_id, amount, type, description, transaction_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING 
       RETURNING *`,
      [txId, req.user?.id, category_id, amount, type, description, transaction_date]
    );
    
    if (result.rows.length === 0) {
      // It was a duplicate sync (idempotency check passed)
      res.status(200).json({ message: 'Transaction already synced' });
      return;
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Sync multiple offline transactions
export const syncTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { transactions } = req.body;
  
  if (!Array.isArray(transactions)) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  try {
    const synced = [];
    for (const tx of transactions) {
      const result = await query(
        `INSERT INTO transactions (id, user_id, category_id, amount, type, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING 
         RETURNING id`,
        [tx.id, req.user?.id, tx.category_id, tx.amount, tx.type, tx.description, tx.transaction_date]
      );
      if (result.rows.length > 0) synced.push(tx.id);
    }
    
    res.json({ message: 'Sync successful', synced });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during sync' });
  }
};

// Budgets
export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  const { year_month } = req.query;
  
  try {
    // IDOR Protection: Query restricted by user_id
    let queryStr = 'SELECT * FROM monthly_budgets WHERE user_id = $1';
    const params = [req.user?.id];

    if (year_month) {
      queryStr += ' AND year_month = $2';
      params.push(year_month);
    }

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  const { category_id, year_month, limit_amount } = req.body;
  
  try {
    const result = await query(
      `INSERT INTO monthly_budgets (id, user_id, category_id, year_month, limit_amount)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category_id, year_month) 
       DO UPDATE SET limit_amount = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [crypto.randomUUID(), req.user?.id, category_id, year_month, limit_amount]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
