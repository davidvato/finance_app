import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/adminController';
import { authenticateJWT, authorizeRole } from '../middlewares/auth';

const router = Router();

// Apply auth and admin-only role to all routes in this router
router.use(authenticateJWT, authorizeRole(['ADMIN']));

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
