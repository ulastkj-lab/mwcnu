/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState, Banom } from '../schema';

export default {
  id: '0002_create_banoms',
  up: (db: DatabaseState): void => {
    if (!db.banoms) {
      db.banoms = [];
    }

    const defaultBanoms: Omit<Banom, 'created_at' | 'updated_at'>[] = [
      {
        id: 1,
        name: 'GP Ansor (Gerakan Pemuda Ansor)',
        type: 'Banom',
        leader_name: 'Sahabat Hilman Farid, M.Pd.',
        contact_no: '085222333001'
      },
      {
        id: 2,
        name: 'Muslimat NU',
        type: 'Banom',
        leader_name: 'Hj. Elis Halimah, S.Ag.',
        contact_no: '085222333002'
      },
      {
        id: 3,
        name: 'Fatayat NU',
        type: 'Banom',
        leader_name: 'Neng Kokom Komalasari',
        contact_no: '085222333003'
      },
      {
        id: 4,
        name: 'IPNU (Ikatan Pelajar Nahdlatul Ulama)',
        type: 'Banom',
        leader_name: 'Rekan Fahmi Nurul Alam',
        contact_no: '085222333004'
      },
      {
        id: 5,
        name: 'IPPNU (Ikatan Pelajar Putri Nahdlatul Ulama)',
        type: 'Banom',
        leader_name: 'Rekanita Siti Maryam',
        contact_no: '085222333005'
      },
      {
        id: 6,
        name: 'Pagar Nusa (Pencak Silat NU)',
        type: 'Banom',
        leader_name: 'Kang Dudung Bahrul Ulum',
        contact_no: '085222333006'
      },
      {
        id: 7,
        name: 'LAZISNU (Lembaga Amil Zakat, Infak, dan Sedekah NU)',
        type: 'Lembaga',
        leader_name: 'H. Ade Juhendi, S.E.',
        contact_no: '085222333007'
      },
      {
        id: 8,
        name: 'LP Ma\'arif NU (Lembaga Pendidikan Ma\'arif NU)',
        type: 'Lembaga',
        leader_name: 'Drs. H. Maman Suratman, M.Si.',
        contact_no: '085222333008'
      },
      {
        id: 9,
        name: 'LDNU (Lembaga Dakwah NU)',
        type: 'Lembaga',
        leader_name: 'Kyai Cecep Qoribullah',
        contact_no: '085222333009'
      },
      {
        id: 10,
        name: 'LKNU (Lembaga Kesehatan NU)',
        type: 'Lembaga',
        leader_name: 'dr. H. Rahmat Wijaya',
        contact_no: '085222333010'
      }
    ];

    const now = new Date().toISOString();
    db.banoms = defaultBanoms.map(b => ({
      ...b,
      created_at: now,
      updated_at: now
    }));
  }
};
