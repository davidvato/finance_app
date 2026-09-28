import { Request, Response, NextFunction } from 'express';

export const verifyTurnstile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.body['cf-turnstile-response'];
  const ip = req.ip || req.socket.remoteAddress;

  if (!token) {
    res.status(400).json({ error: 'Turnstile token missing' });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('secret', process.env.TURNSTILE_SECRET as string);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const outcome = await result.json();

    if (!outcome.success) {
      res.status(400).json({ error: 'Invalid CAPTCHA', details: outcome['error-codes'] });
      return;
    }

    next();
  } catch (error) {
    console.error('Turnstile verification error:', error);
    res.status(500).json({ error: 'CAPTCHA verification failed' });
  }
};
