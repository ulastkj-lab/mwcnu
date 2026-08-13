/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';

type UserRole = 'Super Admin' | 'Ketua MWC' | 'Sekretaris' | 'Bendahara' | 'Operator' | 'Admin Ranting' | 'Admin Banom' | 'Viewer';

/**
 * Limit access to specific roles only
 * Mimics Laravel's 'role:superadmin,sekretaris' middleware pattern
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Peran Anda (${req.user.role}) tidak memiliki izin untuk melakukan tindakan ini.`
      });
      return;
    }

    next();
  };
}

/**
 * Helper to check scope boundaries for data mutation
 * Admin Ranting can ONLY mutate data belonging to their own Ranting.
 * Admin Banom can ONLY mutate data belonging to their own Banom.
 */
export function verifyDataScope(
  getDataRantingId: (req: Request) => number | null,
  getDataBanomId: (req: Request) => number | null
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Super Admin, Ketua MWC, Sekretaris, Bendahara and Operator have global scale
    if (['Super Admin', 'Ketua MWC', 'Sekretaris', 'Bendahara', 'Operator'].includes(user.role)) {
      next();
      return;
    }

    // Admin Ranting boundary constraint
    if (user.role === 'Admin Ranting') {
      const dataRantingId = getDataRantingId(req);
      if (dataRantingId !== null && user.ranting_id !== dataRantingId) {
        res.status(403).json({
          success: false,
          message: 'Pelanggaran Otoritas: Anda hanya diperbolehkan mengelola data sensus pada Ranting wilayah domisili Anda.'
        });
        return;
      }
    }

    // Admin Banom boundary constraint
    if (user.role === 'Admin Banom') {
      const dataBanomId = getDataBanomId(req);
      if (dataBanomId !== null && user.banom_id !== dataBanomId) {
        res.status(403).json({
          success: false,
          message: 'Pelanggaran Otoritas: Anda hanya diperbolehkan mengelola data pada Badan Otonom terafiliasi.'
        });
        return;
      }
    }

    next();
  };
}
