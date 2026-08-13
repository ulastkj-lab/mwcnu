/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../db/db';

/**
 * Express middleware to automatically log mutating requests (POST, PUT, DELETE)
 * into the database audit log for institutional security and transparency.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Capture response send to detect successful operations
  const originalSend = res.send;
  const method = req.method;
  
  // Only log state-changing methods (POST, PUT, PATCH, DELETE)
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    next();
    return;
  }

  res.send = function (body) {
    const responseStatus = res.statusCode;

    // Only log if the operation succeeded (2xx)
    if (responseStatus >= 200 && responseStatus < 300) {
      const user = req.user;
      const path = req.originalUrl;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      let action = 'Mutasi Data';
      let description = `${method} request to ${path}`;

      // Customize descriptions for friendly readable logs
      if (path.includes('/api/auth/login')) {
        action = 'Sesi Login';
        description = 'Berhasil melakukan login ke dalam sistem';
      } else if (path.includes('/api/sensus')) {
        if (method === 'POST') {
          action = 'Pendaftaran Sensus';
          description = `Mendaftarkan warga baru dalam basis sensus`;
        } else if (method === 'PUT') {
          action = 'Pembaruan Sensus';
          description = `Mengedit data profil sensus warga`;
        } else if (path.includes('/verify')) {
          action = 'Verifikasi Sensus';
          description = 'Mengubah status persetujuan data sensus warga';
        }
      } else if (path.includes('/api/keuangan')) {
        action = method === 'POST' ? 'Transaksi Kas Masuk' : 'Pembaruan Buku Kas';
        description = `Mencatatkan pencatatan keuangan organisasi`;
      } else if (path.includes('/api/inventaris')) {
        action = 'Kelola Aset';
        description = `Memperbarui log inventaris/peminjaman barang`;
      }

      // Log to database asynchronously
      try {
        db.logActivity(
          user ? user.id : null,
          user ? user.email : 'Guest / System',
          action,
          description,
          clientIp
        );
      } catch (err) {
        console.error('Failed to log audit activity:', err);
      }
    }

    return originalSend.apply(res, arguments as any);
  };

  next();
}
