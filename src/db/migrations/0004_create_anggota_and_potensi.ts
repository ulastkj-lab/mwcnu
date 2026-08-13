/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState, Potensi, Anggota, AnggotaPendidikan, AnggotaPekerjaan, AnggotaPotensi } from '../schema';

export default {
  id: '0004_create_anggota_and_potensi',
  up: (db: DatabaseState): void => {
    if (!db.potensi) db.potensi = [];
    if (!db.anggota) db.anggota = [];
    if (!db.anggota_pendidikan) db.anggota_pendidikan = [];
    if (!db.anggota_pekerjaan) db.anggota_pekerjaan = [];
    if (!db.anggota_potensi) db.anggota_potensi = [];

    // 1. Seed Master Potensi SDM
    const defaultPotensi: Omit<Potensi, 'created_at'>[] = [
      { id: 1, name: 'Kyai / Syuriah', category: 'Keagamaan' },
      { id: 2, name: 'Ustadz / Da\'i', category: 'Keagamaan' },
      { id: 3, name: 'Hafidz (Penghafal Al-Qur\'an)', category: 'Keagamaan' },
      { id: 4, name: 'Qori (Seni Tilawah)', category: 'Keagamaan' },
      { id: 5, name: 'Takmir Masjid', category: 'Keagamaan' },
      { id: 6, name: 'Guru TPQ / Madrasah', category: 'Keagamaan' },
      { id: 7, name: 'Guru / Pendidik', category: 'Akademis' },
      { id: 8, name: 'Dosen / Akademisi', category: 'Akademis' },
      { id: 9, name: 'Dokter', category: 'Kesehatan' },
      { id: 10, name: 'Perawat / Bidan', category: 'Kesehatan' },
      { id: 11, name: 'Programmer / IT Specialist', category: 'Teknologi' },
      { id: 12, name: 'Desainer Grafis', category: 'Kreatif' },
      { id: 13, name: 'Fotografer / Videografer', category: 'Kreatif' },
      { id: 14, name: 'MC / Protokol', category: 'Seni & Komunikasi' },
      { id: 15, name: 'Pengusaha / Wiraswasta', category: 'Ekonomi' },
      { id: 16, name: 'Petani / Pekebun', category: 'Ekonomi' },
      { id: 17, name: 'Peternak', category: 'Ekonomi' },
      { id: 18, name: 'Relawan / Banser', category: 'Sosial & Keamanan' }
    ];

    const now = new Date().toISOString();
    db.potensi = defaultPotensi.map(p => ({ ...p, created_at: now }));

    // 2. Seed Initial Sensus Members (Anggota) with Normalized Details (Pendidikan & Pekerjaan)
    const membersData: {
      anggota: Omit<Anggota, 'created_at' | 'updated_at'>;
      pendidikan: Omit<AnggotaPendidikan, 'id' | 'anggota_id' | 'created_at' | 'updated_at'>;
      pekerjaan: Omit<AnggotaPekerjaan, 'id' | 'anggota_id' | 'created_at' | 'updated_at'>;
      potensiIds: number[];
    }[] = [
      {
        anggota: {
          id: 1,
          nik: '3205121204850001',
          no_kk: '3205122108120032',
          name: 'H. Aceng Muhammad',
          gender: 'L',
          place_of_birth: 'Garut',
          date_of_birth: '1985-04-12',
          marital_status: 'Kawin',
          is_alive: true,
          address: 'Kp. Godog RT 01 RW 03',
          rt: '01',
          rw: '03',
          phone: '081322445501',
          email: 'aceng.m@gmail.com',
          photo_url: null,
          ranting_id: 7, // Desa Godog
          banom_id: null,
          jamiyah: 'Majelis Taklim Al-Falah',
          status_active: true,
          year_joined: 2010,
          kta_number: 'KTA-320512-070001',
          status_sensus: 'Disetujui',
          notes: 'Verifikasi KTA berhasil',
          created_by_uid: 'operator_ranting1_uid'
        },
        pendidikan: {
          last_education: 'S1',
          school_name: 'IAIN Sunan Gunung Djati',
          major: 'Hukum Islam',
          pesantren_name: 'Pondok Pesantren Cipasung',
          pesantren_duration_years: 6,
          skills: 'Kajian Kitab Kuning, Dakwah',
          certifications: 'Sertifikasi Penyuluh Agama Kemenag'
        },
        pekerjaan: {
          profession: 'Guru / Pendidik',
          company_name: 'MAN 1 Garut',
          position: 'Guru Fiqih',
          has_umkm: true,
          umkm_name: 'Kios Kitab Al-Falah',
          umkm_sector: 'Perdagangan Buku/Kitab',
          monthly_income: 'Rp 3.000.000 - Rp 5.000.000'
        },
        potensiIds: [1, 2, 7] // Kyai, Ustadz, Guru
      },
      {
        anggota: {
          id: 2,
          nik: '3205121510920002',
          no_kk: '3205120509150044',
          name: 'Siti Fatimah, S.Pd.',
          gender: 'P',
          place_of_birth: 'Garut',
          date_of_birth: '1992-10-15',
          marital_status: 'Kawin',
          is_alive: true,
          address: 'Jl. Raya Karangmulya No. 12',
          rt: '02',
          rw: '01',
          phone: '085244556602',
          email: 'siti.fatimah@gmail.com',
          photo_url: null,
          ranting_id: 1, // Kelurahan Karangmulya
          banom_id: 2, // Muslimat NU
          jamiyah: 'Jamiyyah Yasin Muslimat Karangmulya',
          status_active: true,
          year_joined: 2015,
          kta_number: 'KTA-320512-010002',
          status_sensus: 'Disetujui',
          notes: 'Data berkas lengkap',
          created_by_uid: 'operator_ranting1_uid'
        },
        pendidikan: {
          last_education: 'S1',
          school_name: 'STKIP Garut',
          major: 'Pendidikan Bahasa Inggris',
          pesantren_name: 'Pondok Pesantren Al-Falah Biru',
          pesantren_duration_years: 3,
          skills: 'Bahasa Inggris, Manajemen Organisasi',
          certifications: 'Sertifikasi Pendidik Kemendikbud'
        },
        pekerjaan: {
          profession: 'Guru / Pendidik',
          company_name: 'MTs Maarif Karangpawitan',
          position: 'Guru Bahasa Inggris',
          has_umkm: false,
          umkm_name: null,
          umkm_sector: null,
          monthly_income: 'Rp 1.500.000 - Rp 3.000.000'
        },
        potensiIds: [2, 6, 7] // Ustadz, Guru TPQ, Guru
      },
      {
        anggota: {
          id: 3,
          nik: '3205121008980003',
          no_kk: '3205122506190012',
          name: 'Yudi Lesmana',
          gender: 'L',
          place_of_birth: 'Garut',
          date_of_birth: '1998-08-10',
          marital_status: 'Belum Kawin',
          is_alive: true,
          address: 'Kp. Situgede RT 03 RW 04',
          rt: '03',
          rw: '04',
          phone: '089877665503',
          email: 'yudi.lesmana@gmail.com',
          photo_url: null,
          ranting_id: 6, // Desa Situgede
          banom_id: 1, // GP Ansor
          jamiyah: 'Majelis Rijalul Ansor Situgede',
          status_active: true,
          year_joined: 2018,
          kta_number: 'KTA-320512-060003',
          status_sensus: 'Disetujui',
          notes: 'Divalidasi otomatis',
          created_by_uid: 'operator_ranting2_uid'
        },
        pendidikan: {
          last_education: 'D3',
          school_name: 'Politeknik Garut',
          major: 'Teknik Informatika',
          pesantren_name: null,
          pesantren_duration_years: null,
          skills: 'Programming, Jaringan, Web Design',
          certifications: 'CCNA Router & Switching'
        },
        pekerjaan: {
          profession: 'Programmer / IT Specialist',
          company_name: 'CV Garut Media Solusi',
          position: 'Web Developer',
          has_umkm: false,
          umkm_name: null,
          umkm_sector: null,
          monthly_income: 'Rp 3.000.000 - Rp 5.000.000'
        },
        potensiIds: [11, 12, 18] // Programmer, Desainer, Relawan/Banser
      },
      {
        anggota: {
          id: 4,
          nik: '3205120101900004',
          no_kk: '3205120202150021',
          name: 'H. Cecep Gunawan',
          gender: 'L',
          place_of_birth: 'Garut',
          date_of_birth: '1990-01-01',
          marital_status: 'Kawin',
          is_alive: true,
          address: 'Kp. Lebakjaya Indah No. 3',
          rt: '01',
          rw: '02',
          phone: '081299887704',
          email: 'cecep.g@gmail.com',
          photo_url: null,
          ranting_id: 2, // Kelurahan Lebakjaya
          banom_id: null,
          jamiyah: 'Majelis Taklim Ar-Raudhoh',
          status_active: true,
          year_joined: 2012,
          kta_number: null,
          status_sensus: 'Menunggu Verifikasi',
          notes: 'Menunggu verifikasi operator MWC',
          created_by_uid: 'operator_ranting2_uid'
        },
        pendidikan: {
          last_education: 'SMA',
          school_name: 'MA Maarif Karangpawitan',
          major: 'IPS',
          pesantren_name: 'Pondok Pesantren Al-Ghazali',
          pesantren_duration_years: 3,
          skills: 'Pertanian Terpadu, Peternakan Domba',
          certifications: null
        },
        pekerjaan: {
          profession: 'Petani / Pekebun',
          company_name: 'Mandiri',
          position: 'Pemilik Lahan',
          has_umkm: true,
          umkm_name: 'Kelompok Tani Subur Makmur',
          umkm_sector: 'Pertanian & Peternakan',
          monthly_income: 'Rp 5.000.000 - Rp 10.000.000'
        },
        potensiIds: [15, 16, 17] // Wiraswasta, Petani, Peternak
      },
      {
        anggota: {
          id: 5,
          nik: '3205121406950005',
          no_kk: '3205121203200056',
          name: 'M. Wildan',
          gender: 'L',
          place_of_birth: 'Garut',
          date_of_birth: '1995-06-14',
          marital_status: 'Belum Kawin',
          is_alive: true,
          address: 'Kp. Lengkong Tengah No. 25',
          rt: '03',
          rw: '01',
          phone: '081122334405',
          email: 'wildan@gmail.com',
          photo_url: null,
          ranting_id: 4, // Kelurahan Lengkongjaya
          banom_id: 1, // GP Ansor
          jamiyah: 'Rijalul Ansor Lengkongjaya',
          status_active: true,
          year_joined: 2017,
          kta_number: null,
          status_sensus: 'Draft',
          notes: 'Dalam proses pengisian berkas',
          created_by_uid: 'operator_ranting1_uid'
        },
        pendidikan: {
          last_education: 'SMA',
          school_name: 'SMK Negeri 1 Garut',
          major: 'Multimedia',
          pesantren_name: null,
          pesantren_duration_years: null,
          skills: 'Editing Video, Fotografi, Videografi',
          certifications: null
        },
        pekerjaan: {
          profession: 'Fotografer / Videografer',
          company_name: 'Wildan Studio Creative',
          position: 'Owner',
          has_umkm: true,
          umkm_name: 'Wildan Studio',
          umkm_sector: 'Kreatif Jasa',
          monthly_income: 'Rp 1.500.000 - Rp 3.000.000'
        },
        potensiIds: [13, 18] // Fotografer/Videografer, Relawan/Banser
      }
    ];

    // Bulk Insert
    let eduId = 1;
    let jobId = 1;

    for (const item of membersData) {
      // Insert Anggota
      const entryAnggota: Anggota = {
        ...item.anggota,
        created_at: now,
        updated_at: now
      };
      db.anggota.push(entryAnggota);

      // Insert Pendidikan
      const entryEdu: AnggotaPendidikan = {
        id: eduId++,
        anggota_id: item.anggota.id,
        ...item.pendidikan,
        created_at: now,
        updated_at: now
      };
      db.anggota_pendidikan.push(entryEdu);

      // Insert Pekerjaan
      const entryJob: AnggotaPekerjaan = {
        id: jobId++,
        anggota_id: item.anggota.id,
        ...item.pekerjaan,
        created_at: now,
        updated_at: now
      };
      db.anggota_pekerjaan.push(entryJob);

      // Insert Many-to-Many Potensi Junctions
      for (const pId of item.potensiIds) {
        const entryPot: AnggotaPotensi = {
          anggota_id: item.anggota.id,
          potensi_id: pId
        };
        db.anggota_potensi.push(entryPot);
      }
    }
  }
};
