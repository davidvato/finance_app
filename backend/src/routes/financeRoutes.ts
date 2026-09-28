import { Router } from 'express';
import { 
  getCategories, createCategory,
  getTransactions, createTransaction, syncTransactions,
  getBudgets, setBudget
} from '../controllers/financeController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Apply auth to all finance routes
router.use(authenticateJWT);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);

// Transactions
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.post('/transactions/sync', syncTransactions);

// Budgets
router.get('/budgets', getBudgets);
router.post('/budgets', setBudget);

export default router;
