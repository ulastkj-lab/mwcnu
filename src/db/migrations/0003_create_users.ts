/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState, User } from '../schema';

export default {
  id: '0003_create_users',
  up: (db: DatabaseState): void => {
    if (!db.users) {
      db.users = [];
    }

    const defaultUsers: Omit<User, 'created_at' | 'updated_at'>[] = [
      {
        id: 1,
        uid: 'admin_uid',
        email: 'admin',
        name: 'Administrator MWC NU',
        role: 'Super Admin',
        ranting_id: null,
        banom_id: null,
        password: 'mwcnukarpaw'
      },
      {
        id: 2,
        uid: 'superadmin_uid',
        email: 'ulas.tkj@gmail.com', // Primary test email
        name: 'Fahmi Taufiq Zain, ST (Super Admin)',
        role: 'Super Admin',
        ranting_id: null,
        banom_id: null,
        password: 'mwcnukarpaw'
      },
      {
        id: 3,
        uid: 'ketua_uid',
        email: 'ketua@simmwc.or.id',
        name: 'KH. Agus Khoerus soimin (Ketua MWC)',
        role: 'Ketua MWC',
        ranting_id: null,
        banom_id: null,
        password: 'mwcnukarpaw'
      },
      {
        id: 3,
        uid: 'sekretaris_uid',
        email: 'sekretaris@simmwc.or.id',
        name: 'Cep Dindin, S.Pd (Sekretaris MWC)',
        role: 'Sekretaris',
        ranting_id: null,
        banom_id: null
      },
      {
        id: 4,
        uid: 'bendahara_uid',
        email: 'bendahara@simmwc.or.id',
        name: 'H. Asep (Bendahara MWC)',
        role: 'Bendahara',
        ranting_id: null,
        banom_id: null
      },
      {
        id: 5,
        uid: 'operator_uid',
        email: 'operator@simmwc.or.id',
        name: 'Iqbal (Operator MWC)',
        role: 'Operator',
        ranting_id: null,
        banom_id: null
      },
      {
        id: 6,
        uid: 'operator_ranting1_uid',
        email: 'karangmulya@simmwc.or.id',
        name: 'Dani Ramdani (Admin Ranting Karangmulya)',
        role: 'Admin Ranting',
        ranting_id: 1, // Kelurahan Karangmulya
        banom_id: null
      },
      {
        id: 7,
        uid: 'operator_ranting2_uid',
        email: 'lebakjaya@simmwc.or.id',
        name: 'Agus Mulyadi (Admin Ranting Lebakjaya)',
        role: 'Admin Ranting',
        ranting_id: 2, // Kelurahan Lebakjaya
        banom_id: null
      },
      {
        id: 8,
        uid: 'operator_banom1_uid',
        email: 'ansor@simmwc.or.id',
        name: 'Ridwan Pamungkas (Admin GP Ansor)',
        role: 'Admin Banom',
        ranting_id: null,
        banom_id: 1 // GP Ansor
      },
      {
        id: 9,
        uid: 'viewer_uid',
        email: 'viewer@simmwc.or.id',
        name: 'Jama\'ah',
        role: 'Viewer',
        ranting_id: null,
        banom_id: null
      }
    ];

    const now = new Date().toISOString();
    db.users = defaultUsers.map(u => ({
      ...u,
      created_at: now,
      updated_at: now
    }));
  }
};
