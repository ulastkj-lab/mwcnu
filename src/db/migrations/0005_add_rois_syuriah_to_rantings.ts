/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState } from '../schema';

export default {
  id: '0005_add_rois_syuriah_to_rantings',
  up: (db: DatabaseState): void => {
    if (!db.rantings) {
      db.rantings = [];
    }

    const defaultRoisNames: { [key: number]: string } = {
      1: 'K.H. Ahmad Zakaria',
      2: 'Kyai Maimun Zubair',
      3: 'K.H. Bunyamin',
      4: 'Ust. Habibuddin',
      5: 'Kyai Hasan Basri',
      6: 'K.H. Abdul Halim',
      7: 'K.H. Shohibul Wafa',
      8: 'Ust. Saepul Millah',
      9: 'Kyai Anwar Musaddad',
      10: 'K.H. Qamaruddin',
      11: 'Kyai Muhyiddin',
      12: 'Ust. Ma\'ruf Amin',
      13: 'Kyai Syihabuddin',
      14: 'Ust. Zainal Abidin',
      15: 'K.H. Muhammad Nuh',
      16: 'Kyai Iskandar',
      17: 'Ust. Fahrurozi',
      18: 'K.H. Badruzzaman',
      19: 'Kyai Ruhiat',
      20: 'Ust. Solihuddin'
    };

    // Update each existing ranting to ensure they have a rois_name
    db.rantings = db.rantings.map(ranting => {
      const roisName = defaultRoisNames[ranting.id] || 'K.H. Syarifuddin';
      return {
        ...ranting,
        rois_name: ranting.rois_name || roisName
      };
    });
  }
};
