/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';
import { Anggota, AnggotaPendidikan, AnggotaPekerjaan, AnggotaPotensi } from '../../db/schema';

function saveMemberPotentials(state: any, memberId: number, potensiIds?: any[], customPotensiNames?: any[]): void {
  const finalIds: number[] = [];

  if (potensiIds && Array.isArray(potensiIds)) {
    for (const id of potensiIds) {
      const numId = Number(id);
      if (!isNaN(numId) && !finalIds.includes(numId)) {
        finalIds.push(numId);
      }
    }
  }

  if (customPotensiNames && Array.isArray(customPotensiNames)) {
    if (!state.potensi) state.potensi = [];
    for (const rawName of customPotensiNames) {
      const cleanName = String(rawName).trim();
      if (!cleanName) continue;

      let existing = state.potensi.find((p: any) => p.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        if (!finalIds.includes(existing.id)) {
          finalIds.push(existing.id);
        }
      } else {
        const nextId = state.potensi.length > 0 ? Math.max(...state.potensi.map((p: any) => p.id)) + 1 : 1;
        const newPot = {
          id: nextId,
          name: cleanName,
          category: 'Keahlian Khusus / Custom',
          created_at: new Date().toISOString()
        };
        state.potensi.push(newPot);
        finalIds.push(nextId);
      }
    }
  }

  for (const pId of finalIds) {
    state.anggota_potensi.push({
      anggota_id: memberId,
      potensi_id: pId
    });
  }
}

export const SensusController = {
  /**
   * Returns list of all available potentials in system
   */
  listPotensi: (req: Request, res: Response): void => {
    const dbState = db.getState();
    res.status(200).json({
      success: true,
      data: dbState.potensi || []
    });
  },
  /**
   * Retrieves members with full 3NF joins (Education, Profession, Potentials)
   * Enforces role-based visibility constraints.
   */
  list: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const { ranting_id, banom_id, status_sensus, search } = req.query;
    const dbState = db.getState();

    let list = [...dbState.anggota];

    // Enforce Admin Ranting boundary at server level
    if (user.role === 'Admin Ranting') {
      list = list.filter(m => m.ranting_id === user.ranting_id);
    } else if (ranting_id) {
      list = list.filter(m => m.ranting_id === Number(ranting_id));
    }

    // Filter by Banom
    if (banom_id) {
      list = list.filter(m => m.banom_id === Number(banom_id));
    }

    // Filter by Sensus Status
    if (status_sensus) {
      list = list.filter(m => m.status_sensus === String(status_sensus));
    }

    // Filter by Search text (NIK, KK, Name, Phone)
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        m.no_kk.includes(q) ||
        (m.phone && m.phone.includes(q))
      );
    }

    // Join tables 1-to-1 and Many-to-Many
    const enrichedList = list.map(m => {
      const edu = dbState.anggota_pendidikan.find(e => e.anggota_id === m.id) || null;
      const job = dbState.anggota_pekerjaan.find(j => j.anggota_id === m.id) || null;
      
      // Resolve potentials mapped via junction table
      const junctionIds = dbState.anggota_potensi
        .filter(ap => ap.anggota_id === m.id)
        .map(ap => ap.potensi_id);
      const potentials = dbState.potensi.filter(p => junctionIds.includes(p.id));

      const ranting = dbState.rantings.find(r => r.id === m.ranting_id);
      const banom = m.banom_id ? dbState.banoms.find(b => b.id === m.banom_id) : null;

      return {
        ...m,
        pendidikan: edu,
        pekerjaan: job,
        potensi: potentials,
        ranting_name: ranting ? ranting.name : 'Unknown Ranting',
        banom_name: banom ? banom.name : null
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedList
    });
  },

  /**
   * Registers a new member with transactional safety
   */
  create: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const {
      nik, no_kk, name, gender, place_of_birth, date_of_birth, marital_status,
      address, rt, rw, phone, email, photo_url, ranting_id, banom_id, jamiyah, year_joined,
      pendidikan, pekerjaan, potensi_ids, custom_potensi_names, mwc_posisi, mwc_posisi_nama, mwc_jabatan
    } = req.body;

    // Validate main inputs
    if (!nik || !no_kk || !name || !ranting_id) {
      res.status(400).json({ success: false, message: 'Formulir belum lengkap. NIK, KK, Nama, dan Ranting wajib diisi.' });
      return;
    }

    if (user.role === 'Admin Ranting' && user.ranting_id !== Number(ranting_id)) {
      res.status(403).json({ success: false, message: 'Akses Ditolak: Anda hanya dapat mendaftarkan warga di wilayah Ranting Anda.' });
      return;
    }

    try {
      const result = db.transaction((state) => {
        // NIK Duplication Guard
        const exists = state.anggota.some(m => m.nik === String(nik));
        if (exists) {
          throw new Error(`Gagal: Warga dengan NIK ${nik} sudah terdaftar sebelumnya dalam sistem.`);
        }

        const id = state.anggota.length > 0 ? Math.max(...state.anggota.map(a => a.id)) + 1 : 1;

        const newAnggota: Anggota = {
          id,
          nik,
          no_kk,
          name,
          gender,
          place_of_birth: place_of_birth || null,
          date_of_birth: date_of_birth || null,
          marital_status: marital_status || null,
          is_alive: true,
          address: address || null,
          rt: rt || null,
          rw: rw || null,
          phone: phone || null,
          email: email || null,
          photo_url: photo_url || null,
          ranting_id: Number(ranting_id),
          banom_id: banom_id ? Number(banom_id) : null,
          jamiyah: jamiyah || null,
          status_active: true,
          year_joined: year_joined ? Number(year_joined) : new Date().getFullYear(),
          kta_number: null,
          // If operator MWC is doing the input, it is auto approved; otherwise it is a Draft/Pending
          status_sensus: ['Super Admin', 'Ketua MWC', 'Sekretaris', 'Operator'].includes(user.role) 
            ? 'Disetujui' 
            : 'Menunggu Verifikasi',
          notes: 'Input mandiri operator',
          mwc_posisi: mwc_posisi || null,
          mwc_posisi_nama: mwc_posisi_nama || null,
          mwc_jabatan: mwc_jabatan || null,
          created_by_uid: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Generates KTA number immediately if auto approved
        if (newAnggota.status_sensus === 'Disetujui') {
          const rCode = String(ranting_id).padStart(2, '0');
          const mCode = String(id).padStart(4, '0');
          newAnggota.kta_number = `KTA-320512-${rCode}${mCode}`;
        }

        // Save Main
        state.anggota.push(newAnggota);

        // Save Education 1:1
        const newEdu: AnggotaPendidikan = {
          id,
          anggota_id: id,
          last_education: (pendidikan?.last_education as any) || null,
          school_name: pendidikan?.school_name || null,
          major: pendidikan?.major || null,
          pesantren_name: pendidikan?.pesantren_name || null,
          pesantren_duration_years: pendidikan?.pesantren_duration_years ? Number(pendidikan.pesantren_duration_years) : null,
          skills: pendidikan?.skills || null,
          certifications: pendidikan?.certifications || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        state.anggota_pendidikan.push(newEdu);

        // Save Work 1:1
        const newJob: AnggotaPekerjaan = {
          id,
          anggota_id: id,
          profession: pekerjaan?.profession || null,
          company_name: pekerjaan?.company_name || null,
          position: pekerjaan?.position || null,
          has_umkm: !!pekerjaan?.has_umkm,
          umkm_name: pekerjaan?.umkm_name || null,
          umkm_sector: pekerjaan?.umkm_sector || null,
          monthly_income: pekerjaan?.monthly_income || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        state.anggota_pekerjaan.push(newJob);

        // Save Many-To-Many Potentials mapping (standard + custom)
        saveMemberPotentials(state, id, potensi_ids, custom_potensi_names);

        return newAnggota;
      });

      res.status(201).json({
        success: true,
        message: 'Data sensus warga berhasil didaftarkan.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Action of Sensus Workflow Verification (Draft -> Approved or Rejected)
   */
  verify: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Only elevated roles can verify sensus files
    if (!['Super Admin', 'Ketua MWC', 'Sekretaris', 'Operator'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Peran Anda tidak memiliki hak otoritas untuk memverifikasi/menerbitkan KTA.'
      });
      return;
    }

    const { id } = req.params;
    const { status_sensus, notes } = req.body;

    if (!['Disetujui', 'Revisi', 'Ditolak'].includes(status_sensus)) {
      res.status(400).json({ success: false, message: 'Status verifikasi tidak valid.' });
      return;
    }

    try {
      const updated = db.transaction((state) => {
        const citizen = state.anggota.find(m => m.id === Number(id));
        if (!citizen) {
          throw new Error('Data warga tidak ditemukan.');
        }

        citizen.status_sensus = status_sensus;
        citizen.notes = notes || null;
        citizen.updated_at = new Date().toISOString();

        // Dynamically generate KTA number upon approval
        if (status_sensus === 'Disetujui' && !citizen.kta_number) {
          const rCode = String(citizen.ranting_id).padStart(2, '0');
          const mCode = String(citizen.id).padStart(4, '0');
          citizen.kta_number = `KTA-320512-${rCode}${mCode}`;
        } else if (status_sensus !== 'Disetujui') {
          citizen.kta_number = null; // Clear if revoked/needs revision
        }

        return citizen;
      });

      res.status(200).json({
        success: true,
        message: `Status berkas warga berhasil diperbarui menjadi: ${status_sensus}.`,
        data: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Updates an existing member with full 3NF update logic
   */
  update: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const { id } = req.params;
    const {
      nik, no_kk, name, gender, place_of_birth, date_of_birth, marital_status,
      address, rt, rw, phone, email, photo_url, ranting_id, banom_id, jamiyah, year_joined,
      pendidikan, pekerjaan, potensi_ids, custom_potensi_names, mwc_posisi, mwc_posisi_nama, mwc_jabatan, status_sensus
    } = req.body;

    // Validate main inputs
    if (!nik || !no_kk || !name || !ranting_id) {
      res.status(400).json({ success: false, message: 'Formulir belum lengkap. NIK, KK, Nama, dan Ranting wajib diisi.' });
      return;
    }

    try {
      const result = db.transaction((state) => {
        const citizen = state.anggota.find(m => m.id === Number(id));
        if (!citizen) {
          throw new Error('Data warga tidak ditemukan.');
        }

        // Authorization checks
        if (user.role === 'Admin Ranting' && citizen.ranting_id !== user.ranting_id) {
          throw new Error('Akses Ditolak: Anda hanya dapat mengubah data warga di wilayah Ranting Anda.');
        }

        // NIK duplication check (excluding current citizen)
        const exists = state.anggota.some(m => m.nik === String(nik) && m.id !== Number(id));
        if (exists) {
          throw new Error(`Gagal: Warga dengan NIK ${nik} sudah terdaftar sebelumnya dalam sistem.`);
        }

        // Update citizen fields
        citizen.nik = String(nik);
        citizen.no_kk = String(no_kk);
        citizen.name = name;
        citizen.gender = gender;
        citizen.place_of_birth = place_of_birth || null;
        citizen.date_of_birth = date_of_birth || null;
        citizen.marital_status = marital_status || null;
        citizen.address = address || null;
        citizen.rt = rt || null;
        citizen.rw = rw || null;
        citizen.phone = phone || null;
        citizen.email = email || null;
        citizen.photo_url = photo_url || null;
        citizen.ranting_id = Number(ranting_id);
        citizen.banom_id = banom_id ? Number(banom_id) : null;
        citizen.jamiyah = jamiyah || null;
        citizen.year_joined = year_joined ? Number(year_joined) : citizen.year_joined;
        citizen.mwc_posisi = mwc_posisi || null;
        citizen.mwc_posisi_nama = mwc_posisi_nama || null;
        citizen.mwc_jabatan = mwc_jabatan || null;
        citizen.updated_at = new Date().toISOString();

        if (status_sensus) {
          citizen.status_sensus = status_sensus;
        }

        // Regenerate KTA if approved and doesn't have KTA
        if (citizen.status_sensus === 'Disetujui' && !citizen.kta_number) {
          const rCode = String(ranting_id).padStart(2, '0');
          const mCode = String(id).padStart(4, '0');
          citizen.kta_number = `KTA-320512-${rCode}${mCode}`;
        } else if (citizen.status_sensus !== 'Disetujui') {
          citizen.kta_number = null;
        }

        // Update education
        let edu = state.anggota_pendidikan.find(e => e.anggota_id === citizen.id);
        if (!edu) {
          edu = {
            id: citizen.id,
            anggota_id: citizen.id,
            last_education: 'SMA',
            school_name: null,
            major: null,
            pesantren_name: null,
            pesantren_duration_years: null,
            skills: null,
            certifications: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          state.anggota_pendidikan.push(edu);
        }
        edu.last_education = (pendidikan?.last_education as any) || null;
        edu.school_name = pendidikan?.school_name || null;
        edu.major = pendidikan?.major || null;
        edu.pesantren_name = pendidikan?.pesantren_name || null;
        edu.pesantren_duration_years = pendidikan?.pesantren_duration_years ? Number(pendidikan.pesantren_duration_years) : null;
        edu.skills = pendidikan?.skills || null;
        edu.certifications = pendidikan?.certifications || null;
        edu.updated_at = new Date().toISOString();

        // Update work
        let job = state.anggota_pekerjaan.find(j => j.anggota_id === citizen.id);
        if (!job) {
          job = {
            id: citizen.id,
            anggota_id: citizen.id,
            profession: null,
            company_name: null,
            position: null,
            has_umkm: false,
            umkm_name: null,
            umkm_sector: null,
            monthly_income: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          state.anggota_pekerjaan.push(job);
        }
        job.profession = pekerjaan?.profession || null;
        job.company_name = pekerjaan?.company_name || null;
        job.position = pekerjaan?.position || null;
        job.has_umkm = !!pekerjaan?.has_umkm;
        job.umkm_name = pekerjaan?.has_umkm ? pekerjaan?.umkm_name : null;
        job.umkm_sector = pekerjaan?.has_umkm ? pekerjaan?.umkm_sector : null;
        job.monthly_income = pekerjaan?.monthly_income || null;
        job.updated_at = new Date().toISOString();

        // Update Many-to-Many potentials (standard + custom)
        state.anggota_potensi = state.anggota_potensi.filter(ap => ap.anggota_id !== citizen.id);
        saveMemberPotentials(state, citizen.id, potensi_ids, custom_potensi_names);

        return citizen;
      });

      res.status(200).json({
        success: true,
        message: 'Data sensus warga berhasil diperbarui.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Deletes a member and cascades child records
   */
  delete: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const authorizedRoles = ['Super Admin', 'Operator', 'Ketua MWC', 'Sekretaris'];
    if (!authorizedRoles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang menghapus data sensus warga.' });
      return;
    }

    const { id } = req.params;

    try {
      db.transaction((state) => {
        const index = state.anggota.findIndex(m => m.id === Number(id));
        if (index === -1) {
          throw new Error('Data warga tidak ditemukan.');
        }

        const citizen = state.anggota[index];

        if (user.role === 'Admin Ranting' && citizen.ranting_id !== user.ranting_id) {
          throw new Error('Akses Ditolak: Anda hanya dapat menghapus data warga di wilayah Ranting Anda.');
        }

        // Delete main record
        state.anggota.splice(index, 1);

        // Cascade delete child tables
        state.anggota_pendidikan = state.anggota_pendidikan.filter(e => e.anggota_id !== Number(id));
        state.anggota_pekerjaan = state.anggota_pekerjaan.filter(j => j.anggota_id !== Number(id));
        state.anggota_potensi = state.anggota_potensi.filter(ap => ap.anggota_id !== Number(id));
      });

      res.status(200).json({
        success: true,
        message: 'Data sensus warga berhasil dihapus dari sistem.'
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
};
