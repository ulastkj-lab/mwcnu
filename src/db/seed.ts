/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { generateMockMember } from './factory';
import { runMigrations } from './migrations/index';
import { DatabaseState, AnggotaPotensi } from './schema';

/**
 * Reset the database state to empty and run all seeding migrations + mock generators
 * @param additionalCount Number of mock members to generate
 */
export function seedDatabase(additionalCount: number = 45): void {
  db.transaction((state) => {
    console.log('Resetting database state...');
    
    // 1. Wipe all existing tables
    state.rantings = [];
    state.banoms = [];
    state.users = [];
    state.anggota = [];
    state.anggota_pendidikan = [];
    state.anggota_pekerjaan = [];
    state.potensi = [];
    state.anggota_potensi = [];
    state.pengurus = [];
    state.surat = [];
    state.disposisi = [];
    state.agenda = [];
    state.agenda_attendance = [];
    state.inventaris = [];
    state.inventaris_loan = [];
    state.keuangan = [];
    state.news = [];
    state.gallery = [];
    state.guest_book = [];
    state.audit_logs = [];
    state.migrations = []; // Reset migrations list to allow rerun

    console.log('Wiped database state. Executing migrations...');

    // 2. Run all schema migrations & standard seeds
    runMigrations(state);

    console.log(`Completed migrations. Current member count: ${state.anggota.length}`);
    console.log(`Generating ${additionalCount} additional mock members...`);

    // Determine current highest ID (should be 5 after migrations)
    let currentId = state.anggota.length > 0 ? Math.max(...state.anggota.map(a => a.id)) + 1 : 1;

    // Get list of existing ranting and operator IDs to map to
    const rantingIds = state.rantings.map(r => r.id);
    const creatorUids = ['operator_ranting1_uid', 'operator_ranting2_uid', 'operator_uid', 'superadmin_uid'];

    // Generate members distributed across all 20 Rantings
    for (let i = 0; i < additionalCount; i++) {
      const rantingId = rantingIds[i % rantingIds.length]; // Distribute evenly
      const createdByUid = creatorUids[i % creatorUids.length];
      
      const { anggota, pendidikan, pekerjaan, potensiIds } = generateMockMember(
        currentId,
        rantingId,
        createdByUid
      );

      // Save core member
      state.anggota.push(anggota);

      // Save 1-to-1 education details
      state.anggota_pendidikan.push(pendidikan);

      // Save 1-to-1 work details
      state.anggota_pekerjaan.push(pekerjaan);

      // Save many-to-many potentials mapping
      for (const pId of potensiIds) {
        const entry: AnggotaPotensi = {
          anggota_id: anggota.id,
          potensi_id: pId
        };
        state.anggota_potensi.push(entry);
      }

      currentId++;
    }

    // 3. Seed some initial cash transactions for the Finance module
    console.log('Seeding financial transactions...');
    const now = new Date();
    const mockKeuangan = [
      {
        id: 1,
        type: 'Masuk' as const,
        category: 'Infaq Sensus KTA',
        amount: 2500000,
        transaction_date: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        description: 'Penerimaan infaq pembuatan KTA kolektif Ranting Karangmulya',
        proof_file_url: null,
        created_by_uid: 'bendahara_uid'
      },
      {
        id: 2,
        type: 'Masuk' as const,
        category: 'Donatur Tetap',
        amount: 5000000,
        transaction_date: new Date(now.getTime() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
        description: 'Sumbangan pembangunan Sekretariat MWC dari H. Endang',
        proof_file_url: null,
        created_by_uid: 'bendahara_uid'
      },
      {
        id: 3,
        type: 'Keluar' as const,
        category: 'Operasional Kantor',
        amount: 750000,
        transaction_date: new Date(now.getTime() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
        description: 'Pembelian ATK dan konsumsi Rapat Sensus Bulanan',
        proof_file_url: null,
        created_by_uid: 'bendahara_uid'
      },
      {
        id: 4,
        type: 'Masuk' as const,
        category: 'Koin NU LAZISNU',
        amount: 3450000,
        transaction_date: new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
        description: 'Penyaluran Koin NU Ranting Lebakjaya bulan Juni 2026',
        proof_file_url: null,
        created_by_uid: 'bendahara_uid'
      },
      {
        id: 5,
        type: 'Keluar' as const,
        category: 'Bantuan Sosial',
        amount: 1500000,
        transaction_date: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
        description: 'Santunan kematian warga NU musibah kebakaran Desa Godog',
        proof_file_url: null,
        created_by_uid: 'bendahara_uid'
      }
    ];

    const ISO_NOW = now.toISOString();
    state.keuangan = mockKeuangan.map(k => ({
      ...k,
      created_at: ISO_NOW,
      updated_at: ISO_NOW
    }));

    // 4. Seed basic operational items to Inventaris module
    console.log('Seeding assets and inventory...');
    const mockInventaris = [
      {
        id: 1,
        code: 'INV-MWC-001',
        name: 'Proyektor Epson EB-X400',
        category: 'Elektronik',
        location: 'Ruang Media & Sekretariat',
        condition: 'Baik' as const,
        notes: 'Sering dipinjam untuk pengajian Ranting'
      },
      {
        id: 2,
        code: 'INV-MWC-002',
        name: 'Sound System Wireless Portable',
        category: 'Audio',
        location: 'Gudang Utama',
        condition: 'Baik' as const,
        notes: '2 Mic hand-held nirkabel'
      },
      {
        id: 3,
        code: 'INV-MWC-003',
        name: 'Tenda Sarnafil 3x3 Meter',
        category: 'Perlengkapan Luar Ruang',
        location: 'Gudang Utama',
        condition: 'Rusak Ringan' as const,
        notes: 'Sobek tipis di bagian atap kiri'
      }
    ];

    state.inventaris = mockInventaris.map(i => ({
      ...i,
      created_at: ISO_NOW,
      updated_at: ISO_NOW
    }));

    // 5. Seed initial official events to Agenda
    console.log('Seeding agendas...');
    state.agenda = [
      {
        id: 1,
        title: 'Konferensi Ranting NU Se-Kecamatan Karangpawitan',
        description: 'Rapat koordinasi akbar penyeragaman administrasi sensus dan pencetakan KTA massal.',
        start_date: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString(),
        end_date: new Date(now.getTime() + 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
        location: 'Aula Sekretariat MWC NU Karangpawitan',
        is_public: true,
        notulen: null,
        documentation_urls: null,
        created_at: ISO_NOW,
        updated_at: ISO_NOW
      },
      {
        id: 2,
        title: 'Lailatul Ijtima & Pengajian Bulanan Rijalul Ansor',
        description: 'Rutinitas pengajian kitab kuning Al-Hikam dan pembacaan istighosah kubro.',
        start_date: new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString(),
        end_date: new Date(now.getTime() + 5 * 24 * 3600 * 1000 + 2 * 3600 * 1000).toISOString(),
        location: 'Masjid Jami At-Taqwa Ranting Godog',
        is_public: true,
        notulen: null,
        documentation_urls: null,
        created_at: ISO_NOW,
        updated_at: ISO_NOW
      }
    ];

    console.log('Database successfully initialized and populated!');
  });

  db.logActivity(
    1,
    'ulas.tkj@gmail.com',
    'Reset & Seed',
    'Melakukan inisialisasi ulang database dengan data sensor, keuangan, dan aset default'
  );
}

// Self-execute if run as a direct script
if (require.main === module) {
  try {
    seedDatabase();
    console.log('Seed executed successfully through CLI!');
  } catch (error) {
    console.error('CLI Seed execution failed:', error);
  }
}
