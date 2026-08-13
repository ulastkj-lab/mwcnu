/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState } from '../schema';

export default {
  id: '0007_create_mwc_settings',
  up: (db: DatabaseState): void => {
    db.settings = {
      name: 'MWC NU Karangpawitan',
      logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Nahdlatul_Ulama_Logo.svg',
      structure: {
        mustasyar: [
          'KH. Abdu Abdul Qodir',
          'H. Undang Ridwan, S.TP.MM.',
          'KH. Utang Fathullohilmaemun',
          'KH. Ahmad Sobur',
          'KH. Osep Muhammad',
          'KH. Hasan Mustopa',
          'KH. Ahmad Kohar',
          'KH. Asep Ridwan, M.Pd.',
          'Nyimas HJ. Lilim Siti Fatimah',
          'H. Yusa',
          'KA. Mamat',
          'Dr. H. Arvi Iskandar, MMRS.',
          'H. Deden Muhammad',
          'KA. Ahmad Saja, M.Pd.',
          'H. A. Ade Ahmad Komarudin',
          'Ac. Undang, S.Pd.I.'
        ],
        syuriah: {
          rais: 'KA. Muhlis Ulumudin, S.Pd.I.',
          wakil_rais: [
            'KA. Basor Umar Basri',
            'KH. Aceng Hasan',
            'AJ. Ahmad Muman'
          ],
          katib: 'Ust. Hilman Firmansyah, S.Pd.I.',
          wakil_katib: [
            'KA. Asep Hilman',
            'Ac. Pirda'
          ],
          a_wan: [
            'Ac. Unjang Ab Manan',
            'Ac. Nanang, S.THi.',
            'H. A. Dede',
            'H. A. Fahmi Taftazani',
            'Ac. Yusuf firdaus, M.Pd.',
            'Ac. Ruhimin',
            'Ust. Yayan Ruyani, S.Ag.'
          ]
        },
        tanfidziyah: {
          ketua: 'KH. Agus, S.Ag., M.Si.',
          wakil_ketua: [
            'Ac. Agus Ramlan, S.Ag.',
            'Ac. Nanang Ridwan, M.Pd.',
            'Ac. Iim Abdul Karim'
          ],
          sekretaris: 'M. Didin Saeful Hayat',
          wakil_sekretaris: [
            'Dadan Suryana',
            'Saepul Aripin, M.Pd.',
            'Ust. Enang Nuryani, S.Pd.I.'
          ],
          bendahara: 'H. Asep Supriatna',
          wakil_bendahara: [
            'Ac. Nurjaman, S.Pd.',
            'Ac. Irham Hilmi Anshori, S.E.'
          ]
        }
      }
    };
  }
};
