/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState, Ranting } from '../schema';

export default {
  id: '0001_create_rantings',
  up: (db: DatabaseState): void => {
    if (!db.rantings) {
      db.rantings = [];
    }

    // Official 20 Desa/Kelurahan of Kecamatan Karangpawitan, Garut
    const defaultRantings: Omit<Ranting, 'created_at' | 'updated_at'>[] = [
      {
        id: 1,
        code: 'RNT-KP-001',
        name: 'Kelurahan Karangmulya',
        address: 'Jl. Karangmulya No. 45, Karangpawitan, Garut',
        leader_name: 'Ust. H. Jajang Jalaludin',
        secretary_name: 'Asep Saepuloh, S.Pd.I.',
        contact_no: '081234567001',
        latitude: -7.2185,
        longitude: 107.9354
      },
      {
        id: 2,
        code: 'RNT-KP-002',
        name: 'Kelurahan Lebakjaya',
        address: 'Jl. Raya Lebakjaya No. 12, Karangpawitan, Garut',
        leader_name: 'Kyai Ahmad Sanusi',
        secretary_name: 'Dadang Hermawan',
        contact_no: '081234567002',
        latitude: -7.2212,
        longitude: 107.9405
      },
      {
        id: 3,
        code: 'RNT-KP-003',
        name: 'Desa Sindanggalih',
        address: 'Jl. Veteran Sindanggalih, Karangpawitan, Garut',
        leader_name: 'Ust. Cecep Supriadi',
        secretary_name: 'Wawan Gunawan',
        contact_no: '081234567003',
        latitude: -7.2289,
        longitude: 107.9482
      },
      {
        id: 4,
        code: 'RNT-KP-004',
        name: 'Kelurahan Lengkongjaya',
        address: 'Kp. Lengkong No. 8, Karangpawitan, Garut',
        leader_name: 'Ust. Imron Rosyadi',
        secretary_name: 'Dede Rukman',
        contact_no: '081234567004',
        latitude: -7.2132,
        longitude: 107.9298
      },
      {
        id: 5,
        code: 'RNT-KP-005',
        name: 'Desa Jatisari',
        address: 'Jl. Jatisari Km 1, Karangpawitan, Garut',
        leader_name: 'Kyai Maman Abdurrahman',
        secretary_name: 'Encep Solihin',
        contact_no: '081234567005',
        latitude: -7.2054,
        longitude: 107.9254
      },
      {
        id: 6,
        code: 'RNT-KP-006',
        name: 'Desa Situgede',
        address: 'Kp. Situ RT 02 RW 05, Desa Situgede, Garut',
        leader_name: 'K.H. Mumuh Muhyidin',
        secretary_name: 'Heri Herdiana',
        contact_no: '081234567006',
        latitude: -7.2341,
        longitude: 107.9511
      },
      {
        id: 7,
        code: 'RNT-KP-007',
        name: 'Desa Godog',
        address: 'Jl. Makam Prabu Kian Santang, Kp. Godog, Garut',
        leader_name: 'K.H. Aceng Qudsy',
        secretary_name: 'Yudi Wahyudin',
        contact_no: '081234567007',
        latitude: -7.2482,
        longitude: 107.9599
      },
      {
        id: 8,
        code: 'RNT-KP-008',
        name: 'Desa Tanjungsari',
        address: 'Jl. Desa Tanjungsari No. 2, Karangpawitan, Garut',
        leader_name: 'Ust. Deden Ramdani',
        secretary_name: 'Agus Rustandi',
        contact_no: '081234567008',
        latitude: -7.2111,
        longitude: 107.9125
      },
      {
        id: 9,
        code: 'RNT-KP-009',
        name: 'Desa Suci',
        address: 'Jl. Raya Suci No. 110, Karangpawitan, Garut',
        leader_name: 'Kyai Syarif Hidayatullah',
        secretary_name: 'Rahmat Hidayat, S.Sy.',
        contact_no: '081234567009',
        latitude: -7.2078,
        longitude: 107.9012
      },
      {
        id: 10,
        code: 'RNT-KP-010',
        name: 'Desa Cimurah',
        address: 'Kp. Cimurah RT 01 RW 03, Desa Cimurah, Garut',
        leader_name: 'Ust. Usep Saefudin',
        secretary_name: 'Diki Chandra',
        contact_no: '081234567010',
        latitude: -7.2023,
        longitude: 107.9152
      },
      {
        id: 11,
        code: 'RNT-KP-011',
        name: 'Desa Mekarsari',
        address: 'Jl. Mekarsari No. 19, Karangpawitan, Garut',
        leader_name: 'Ust. Agus Salim',
        secretary_name: 'Lukmanul Hakim',
        contact_no: '081234567011',
        latitude: -7.1954,
        longitude: 107.9201
      },
      {
        id: 12,
        code: 'RNT-KP-012',
        name: 'Desa Sukamanah',
        address: 'Kp. Babakan Sukamanah, Karangpawitan, Garut',
        leader_name: 'Kyai Solihin',
        secretary_name: 'Yanyan Sofyan',
        contact_no: '081234567012',
        latitude: -7.1895,
        longitude: 107.9312
      },
      {
        id: 13,
        code: 'RNT-KP-013',
        name: 'Desa Sukabakti',
        address: 'Jl. Sukabakti No. 34, Karangpawitan, Garut',
        leader_name: 'Ust. Asep Nurjaman',
        secretary_name: 'Iman Nurzaman',
        contact_no: '081234567013',
        latitude: -7.1843,
        longitude: 107.9422
      },
      {
        id: 14,
        code: 'RNT-KP-014',
        name: 'Desa Situjaya',
        address: 'Kp. Situ RT 03 RW 01, Desa Situjaya, Garut',
        leader_name: 'Ust. Endang Permana',
        secretary_name: 'Iwan Setiawan',
        contact_no: '081234567014',
        latitude: -7.1812,
        longitude: 107.9515
      },
      {
        id: 15,
        code: 'RNT-KP-015',
        name: 'Desa Karangpawitan',
        address: 'Jl. Raya Karangpawitan No. 89, Garut',
        leader_name: 'K.H. Yusuf Azhar',
        secretary_name: 'Evi Rustandi, S.E.',
        contact_no: '081234567015',
        latitude: -7.2155,
        longitude: 107.9311
      },
      {
        id: 16,
        code: 'RNT-KP-016',
        name: 'Desa Sindangpalay',
        address: 'Kp. Palay RT 02 RW 04, Desa Sindangpalay, Garut',
        leader_name: 'Ust. Jeje Mujahid',
        secretary_name: 'Agus Mulyadi',
        contact_no: '081234567016',
        latitude: -7.2398,
        longitude: 107.9431
      },
      {
        id: 17,
        code: 'RNT-KP-017',
        name: 'Desa Sukamurni',
        address: 'Kp. Sukamurni No. 17, Karangpawitan, Garut',
        leader_name: 'Kyai Engkos Kosasih',
        secretary_name: 'Ade Juanda',
        contact_no: '081234567017',
        latitude: -7.2411,
        longitude: 107.9252
      },
      {
        id: 18,
        code: 'RNT-KP-018',
        name: 'Desa Situgede Timur',
        address: 'Kp. Situ Kaler, Desa Situgede Timur, Garut',
        leader_name: 'Ust. Undang Syarif',
        secretary_name: 'Enjang Koswara',
        contact_no: '081234567018',
        latitude: -7.2312,
        longitude: 107.9611
      },
      {
        id: 19,
        code: 'RNT-KP-019',
        name: 'Desa Tanjungsari Barat',
        address: 'Jl. Tanjungsari No. 9, Karangpawitan, Garut',
        leader_name: 'Kyai Dudung Abdul Hamid',
        secretary_name: 'Ahmad Sodikin',
        contact_no: '081234567019',
        latitude: -7.2098,
        longitude: 107.9054
      },
      {
        id: 20,
        code: 'RNT-KP-020',
        name: 'Desa Mekarsari Jaya',
        address: 'Kp. Mekarjaya RT 04 RW 02, Karangpawitan, Garut',
        leader_name: 'Ust. Saepudin, S.Ag.',
        secretary_name: 'Tatang Sutarman',
        contact_no: '081234567020',
        latitude: -7.1912,
        longitude: 107.9155
      }
    ];

    const now = new Date().toISOString();
    db.rantings = defaultRantings.map(r => ({
      ...r,
      created_at: now,
      updated_at: now
    }));
  }
};
