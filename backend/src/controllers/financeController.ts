import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middlewares/auth';

// ─── Categories ──────────────────────────────────────────────────────────────

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name ASC',
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, color_hex, icon_name, type = 'EXPENSE', budget_amount = null } = req.body;
  if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
  try {
    const result = await query(
      'INSERT INTO categories (id, user_id, name, color_hex, icon_name, type, budget_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [crypto.randomUUID(), req.user?.id, name, color_hex, icon_name, type, budget_amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, color_hex, icon_name, type, budget_amount } = req.body;
  try {
    const result = await query(
      `UPDATE categories 
       SET name = COALESCE($1, name),
           color_hex = COALESCE($2, color_hex),
           icon_name = COALESCE($3, icon_name),
           type = COALESCE($4, type),
           budget_amount = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7 AND deleted_at IS NULL
       RETURNING *`,
      [name, color_hex, icon_name, type, budget_amount ?? null, id, req.user?.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' }); return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      'UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *',
      [id, req.user?.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' }); return;
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT t.*, c.name as category_name, c.icon_name as category_icon, c.color_hex as category_color, c.type as category_type
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.deleted_at IS NULL
       ORDER BY t.transaction_date DESC, t.created_at DESC`,
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, category_id, amount, type, description, transaction_date } = req.body;
  const txId = id || crypto.randomUUID();
  try {
    const result = await query(
      `INSERT INTO transactions (id, user_id, category_id, amount, type, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [txId, req.user?.id, category_id, amount, type, description, transaction_date]
    );
    if (result.rows.length === 0) {
      res.status(200).json({ message: 'Transaction already synced' }); return;
    }
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { category_id, amount, type, description, transaction_date } = req.body;
  try {
    const result = await query(
      `UPDATE transactions
       SET category_id = COALESCE($1, category_id),
           amount = COALESCE($2, amount),
           type = COALESCE($3, type),
           description = COALESCE($4, description),
           transaction_date = COALESCE($5, transaction_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7 AND deleted_at IS NULL
       RETURNING *`,
      [category_id, amount, type, description, transaction_date, id, req.user?.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Transaction not found' }); return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await query(
      'UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *',
      [id, req.user?.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Transaction not found' }); return;
    }
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const syncTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions)) {
    res.status(400).json({ error: 'Invalid payload' }); return;
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

// ─── Budgets ──────────────────────────────────────────────────────────────────

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  const year_month = req.query.year_month as string | undefined;
  try {
    let queryStr = 'SELECT * FROM monthly_budgets WHERE user_id = $1';
    const params: any[] = [req.user?.id];
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

export const getBudgetSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { year_month } = req.query;
  if (!year_month) {
    res.status(400).json({ error: 'year_month is required (format YYYY-MM)' });
    return;
  }
  try {
    const result = await query(
      `SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon_name,
        c.color_hex,
        COALESCE(mb.limit_amount, c.budget_amount) as limit_amount,
        COALESCE(SUM(t.amount), 0) as spent_amount
      FROM categories c
      LEFT JOIN monthly_budgets mb 
        ON c.id = mb.category_id AND mb.year_month = $2 AND mb.user_id = $1
      LEFT JOIN transactions t 
        ON c.id = t.category_id 
        AND TO_CHAR(t.transaction_date, 'YYYY-MM') = $2
        AND t.user_id = $1
        AND t.deleted_at IS NULL
        AND t.type = 'EXPENSE'
      WHERE c.user_id = $1 AND c.deleted_at IS NULL AND c.type = 'EXPENSE'
      GROUP BY c.id, c.name, c.icon_name, c.color_hex, mb.limit_amount, c.budget_amount
      ORDER BY spent_amount DESC`,
      [req.user?.id, year_month]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
