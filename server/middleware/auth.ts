import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'connectly_jwt_secret_default_key_2026';
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

/**
 * Optional authentication: attaches user if token is present and valid,
 * but does not reject the request if token is absent.
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'connectly_jwt_secret_default_key_2026';
    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};

export const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'connectly_jwt_secret_default_key_2026';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};
