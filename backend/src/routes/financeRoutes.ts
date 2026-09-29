import { Router } from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getTransactions, createTransaction, updateTransaction, deleteTransaction, syncTransactions,
  getBudgets, setBudget
} from '../controllers/financeController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();
router.use(authenticateJWT);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Transactions
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);
router.post('/transactions/sync', syncTransactions);

// Budgets
router.get('/budgets', getBudgets);
router.post('/budgets', setBudget);

export default router;
