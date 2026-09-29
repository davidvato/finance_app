import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { AuthRequest } from '../middlewares/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const result = await query('SELECT * FROM users WHERE username = $1 AND is_active = true', [username]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    
    const isValidPassword = await argon2.verify(user.password_hash, password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, must_change_password: user.must_change_password, budget_start_day: user.budget_start_day },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' } // Short lived, realistically would have refresh tokens
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        must_change_password: user.must_change_password,
        budget_start_day: user.budget_start_day
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const me = (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 12) {
    res.status(400).json({ error: 'Password must be at least 12 characters long' });
    return;
  }

  // Basic complexity check: upper, lower, number, symbol
  const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
  if (!complexityRegex.test(newPassword)) {
    res.status(400).json({ error: 'Password must include uppercase, lowercase, numbers, and symbols' });
    return;
  }

  try {
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await query('UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2', [passwordHash, req.user?.id]);
    
    // Regenerate token to update must_change_password claim
    const token = jwt.sign(
      { id: req.user?.id, role: req.user?.role, must_change_password: false, budget_start_day: req.user?.budget_start_day },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { budget_start_day } = req.body;
  
  if (budget_start_day !== undefined && (budget_start_day < 1 || budget_start_day > 31)) {
    res.status(400).json({ error: 'budget_start_day must be between 1 and 31' });
    return;
  }

  try {
    const result = await query(
      'UPDATE users SET budget_start_day = COALESCE($1, budget_start_day) WHERE id = $2 RETURNING id, username, role, must_change_password, budget_start_day',
      [budget_start_day, req.user?.id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = result.rows[0];

    // Regenerate token to include updated data
    const token = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role, must_change_password: updatedUser.must_change_password, budget_start_day: updatedUser.budget_start_day },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

