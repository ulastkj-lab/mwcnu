/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../db/db';
import { User } from '../../db/schema';

// Extend Express Request interface to hold session user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to protect API routes and verify session
 * Mimics Laravel's 'auth' middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Read auth token from headers (simulating session token)
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Unauthenticated. Silakan login terlebih dahulu untuk mengakses sistem.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const dbState = db.getState();
  
  // Find user by UID (our mock session uses the Firebase/Auth UID as Bearer token)
  const user = dbState.users.find(u => u.uid === token);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Sesi kedaluwarsa atau tidak valid. Silakan login kembali.'
    });
    return;
  }

  // Bind authenticated user model to current request context
  req.user = user;
  next();
}
