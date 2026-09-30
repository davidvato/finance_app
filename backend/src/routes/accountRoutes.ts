import { Router } from 'express';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/accountController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();
router.use(authenticateJWT);

router.get('/', getAccounts);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
