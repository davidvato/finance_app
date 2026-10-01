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
      `SELECT t.*, 
        c.name as category_name, c.icon_name as category_icon, c.color_hex as category_color, c.type as category_type,
        a1.name as account_name, a2.name as destination_account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a1 ON t.account_id = a1.id
       LEFT JOIN accounts a2 ON t.destination_account_id = a2.id
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
  const { id, category_id, account_id, destination_account_id, amount, type, description, transaction_date } = req.body;
  const txId = id || crypto.randomUUID();
  try {
    const result = await query(
      `INSERT INTO transactions (id, user_id, category_id, account_id, destination_account_id, amount, type, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
      [txId, req.user?.id, category_id, account_id, destination_account_id || null, amount, type, description, transaction_date]
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
  const { category_id, account_id, destination_account_id, amount, type, description, transaction_date } = req.body;
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (category_id !== undefined) { updateFields.push(`category_id = $${queryIndex++}`); values.push(category_id); }
    if (account_id !== undefined) { updateFields.push(`account_id = $${queryIndex++}`); values.push(account_id); }
    if (destination_account_id !== undefined) { updateFields.push(`destination_account_id = $${queryIndex++}`); values.push(destination_account_id); }
    if (amount !== undefined) { updateFields.push(`amount = $${queryIndex++}`); values.push(amount); }
    if (type !== undefined) { updateFields.push(`type = $${queryIndex++}`); values.push(type); }
    if (description !== undefined) { updateFields.push(`description = $${queryIndex++}`); values.push(description); }
    if (transaction_date !== undefined) { updateFields.push(`transaction_date = $${queryIndex++}`); values.push(transaction_date); }

    if (updateFields.length === 0) {
      res.status(400).json({ error: 'No fields to update' }); return;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    const idIndex = queryIndex++;
    const userIdIndex = queryIndex++;
    values.push(id, req.user?.id);

    const result = await query(
      `UPDATE transactions
       SET ${updateFields.join(', ')}
       WHERE id = $${idIndex} AND user_id = $${userIdIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Transaction not found' }); return;
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
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
        `INSERT INTO transactions (id, user_id, category_id, account_id, destination_account_id, amount, type, description, transaction_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [tx.id, req.user?.id, tx.category_id, tx.account_id, tx.destination_account_id || null, tx.amount, tx.type, tx.description, tx.transaction_date]
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
  const { cycle_id, start_date, end_date } = req.query;
  if (!cycle_id || !start_date || !end_date) {
    res.status(400).json({ error: 'cycle_id, start_date, and end_date are required' });
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
        AND t.transaction_date >= $3::date 
        AND t.transaction_date <= $4::date
        AND t.user_id = $1
        AND t.deleted_at IS NULL
        AND t.type = 'EXPENSE'
      WHERE c.user_id = $1 AND c.deleted_at IS NULL AND c.type = 'EXPENSE'
      GROUP BY c.id, c.name, c.icon_name, c.color_hex, mb.limit_amount, c.budget_amount
      ORDER BY spent_amount DESC`,
      [req.user?.id, cycle_id, start_date, end_date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
