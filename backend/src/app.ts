import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import financeRoutes from './routes/financeRoutes';
import accountRoutes from './routes/accountRoutes';

const createApp = () => {
  const app = express();

  const allowedOrigins = ['http://localhost:5173'];
  if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
  
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api', financeRoutes);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};

export default createApp;
