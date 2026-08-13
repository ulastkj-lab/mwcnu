/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';

export const AuditController = {
  /**
   * Retrieves audit log entries (Reverse chronological order)
   */
  list: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Role boundaries: Only Super Admin, Ketua MWC, or Sekretaris can access security audit trails
    if (!['Super Admin', 'Ketua MWC', 'Sekretaris'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hak akses dibatasi hanya untuk dewan pimpinan MWC (Ketua/Sekretaris) dan administrator.'
      });
      return;
    }

    const dbState = db.getState();
    const logs = [...dbState.audit_logs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.status(200).json({
      success: true,
      data: logs
    });
  }
};
