/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';
import { Ranting } from '../../db/schema';

export function enrichRantingData(r: Ranting, dbState: any) {
  const members = (dbState.anggota || []).filter((m: any) => m.ranting_id === r.id);
  const member_count = members.length;
  const member_l_count = members.filter((m: any) => m.gender === 'L').length;
  const member_p_count = members.filter((m: any) => m.gender === 'P').length;
  const member_approved_count = members.filter((m: any) => m.status_sensus === 'Disetujui').length;

  const memberIds = new Set(members.map((m: any) => m.id));

  // 1. Aggregated Potensi Keahlian & Profesi Warga NU
  const memberPotensiList = (dbState.anggota_potensi || []).filter((ap: any) => memberIds.has(ap.anggota_id));
  const potensiCountMap: Record<number, number> = {};
  for (const ap of memberPotensiList) {
    potensiCountMap[ap.potensi_id] = (potensiCountMap[ap.potensi_id] || 0) + 1;
  }

  const potensi_warga: Array<{ id: number; name: string; category: string; count: number }> = [];
  const allPotensi = dbState.potensi || [];
  for (const pIdStr in potensiCountMap) {
    const pId = Number(pIdStr);
    const potObj = allPotensi.find((p: any) => p.id === pId);
    if (potObj) {
      potensi_warga.push({
        id: potObj.id,
        name: potObj.name,
        category: potObj.category || 'Lainnya',
        count: potensiCountMap[pId]
      });
    }
  }
  potensi_warga.sort((a, b) => b.count - a.count);

  // 2. Aggregated Usaha / UMKM Warga NU
  const allPekerjaan = dbState.anggota_pekerjaan || [];
  const umkm_warga: Array<{ owner_name: string; umkm_name: string; umkm_sector: string }> = [];
  for (const m of members) {
    const pek = allPekerjaan.find((p: any) => p.anggota_id === m.id);
    if (pek && (pek.has_umkm || pek.umkm_name)) {
      umkm_warga.push({
        owner_name: m.name,
        umkm_name: pek.umkm_name || 'Usaha Mandiri Warga',
        umkm_sector: pek.umkm_sector || pek.profession || 'Usaha Rakyat'
      });
    }
  }

  return {
    ...r,
    member_count,
    member_l_count,
    member_p_count,
    member_approved_count,
    potensi_warga,
    umkm_warga
  };
}

export const RantingController = {
  /**
   * List all Rantings, enriched with current member counts and potential summaries
   */
  list: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const dbState = db.getState();
    const rantings = [...dbState.rantings];

    const enrichedRantings = rantings.map(r => enrichRantingData(r, dbState));

    res.status(200).json({
      success: true,
      data: enrichedRantings
    });
  },

  /**
   * Create a new Ranting (Desa/Kelurahan branch)
   */
  create: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Role boundary: Only Super Admin, Ketua MWC, Sekretaris, or Operator can create a Ranting
    const authorizedRoles = ['Super Admin', 'Ketua MWC', 'Sekretaris', 'Operator'];
    if (!authorizedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk menambahkan Ranting baru.'
      });
      return;
    }

    const { code, name, address, rois_name, leader_name, secretary_name, contact_no, latitude, longitude, rois_photo_url, leader_photo_url, secretary_photo_url, potensi_ekonomi, potensi_unggulan } = req.body;

    if (!code || !code.trim() || !name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Kode Ranting dan Nama Ranting wajib diisi.' });
      return;
    }

    try {
      const result = db.transaction((state) => {
        // Validate unique code
        const codeExists = state.rantings.some(r => r.code.toLowerCase() === code.trim().toLowerCase());
        if (codeExists) {
          throw new Error(`Kode Ranting "${code.trim()}" sudah terdaftar.`);
        }

        // Validate unique name
        const nameExists = state.rantings.some(r => r.name.toLowerCase() === name.trim().toLowerCase());
        if (nameExists) {
          throw new Error(`Nama Ranting "${name.trim()}" sudah terdaftar.`);
        }

        const nextId = state.rantings.length > 0 ? Math.max(...state.rantings.map(r => r.id)) + 1 : 1;

        const newRanting: Ranting = {
          id: nextId,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          address: address ? address.trim() : null,
          rois_name: rois_name ? rois_name.trim() : null,
          leader_name: leader_name ? leader_name.trim() : null,
          secretary_name: secretary_name ? secretary_name.trim() : null,
          contact_no: contact_no ? contact_no.trim() : null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          rois_photo_url: rois_photo_url ? rois_photo_url.trim() : null,
          leader_photo_url: leader_photo_url ? leader_photo_url.trim() : null,
          secretary_photo_url: secretary_photo_url ? secretary_photo_url.trim() : null,
          potensi_ekonomi: Array.isArray(potensi_ekonomi) ? potensi_ekonomi : [],
          potensi_unggulan: potensi_unggulan ? potensi_unggulan.trim() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        state.rantings.push(newRanting);
        return newRanting;
      });

      // Log to audit trail
      db.logActivity(
        user.id,
        user.email,
        'CREATE_RANTING',
        `Menambahkan Ranting baru "${result.name}" (Kode: ${result.code})`
      );

      res.status(201).json({
        success: true,
        message: `Ranting ${result.name} berhasil ditambahkan ke sistem.`,
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Update an existing Ranting
   */
  update: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const targetId = Number(req.params.id);
    if (isNaN(targetId)) {
      res.status(400).json({ success: false, message: 'ID Ranting tidak valid.' });
      return;
    }

    // Role boundary:
    // Super Admin, Ketua MWC, Sekretaris, Operator can edit any Ranting.
    // Admin Ranting can only edit their assigned Ranting.
    const isMwcStaff = ['Super Admin', 'Ketua MWC', 'Sekretaris', 'Operator'].includes(user.role);
    const isAdminRanting = user.role === 'Admin Ranting' && user.ranting_id === targetId;

    if (!isMwcStaff && !isAdminRanting) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengubah data Ranting ini.'
      });
      return;
    }

    const { code, name, address, rois_name, leader_name, secretary_name, contact_no, latitude, longitude, rois_photo_url, leader_photo_url, secretary_photo_url, potensi_ekonomi, potensi_unggulan } = req.body;

    if (isMwcStaff && (!code || !code.trim() || !name || !name.trim())) {
      res.status(400).json({ success: false, message: 'Kode Ranting dan Nama Ranting wajib diisi.' });
      return;
    }

    try {
      const result = db.transaction((state) => {
        const index = state.rantings.findIndex(r => r.id === targetId);
        if (index === -1) {
          throw new Error('Ranting tidak ditemukan.');
        }

        const current = state.rantings[index];

        // Unique checks (only if changed and user has MWC staff access)
        if (isMwcStaff) {
          if (code.trim().toUpperCase() !== current.code.trim().toUpperCase()) {
            const codeExists = state.rantings.some(r => Number(r.id) !== Number(targetId) && r.code.trim().toLowerCase() === code.trim().toLowerCase());
            if (codeExists) {
              throw new Error(`Kode Ranting "${code.trim()}" sudah digunakan oleh Ranting lain.`);
            }
          }

          if (name.trim().toLowerCase() !== current.name.trim().toLowerCase()) {
            const nameExists = state.rantings.some(r => Number(r.id) !== Number(targetId) && r.name.trim().toLowerCase() === name.trim().toLowerCase());
            if (nameExists) {
              throw new Error(`Nama Ranting "${name.trim()}" sudah digunakan oleh Ranting lain.`);
            }
          }
        }

        // Apply edits (Admin Ranting cannot edit code or name, only metadata)
        const updatedRanting: Ranting = {
          ...current,
          code: isMwcStaff ? code.trim().toUpperCase() : current.code,
          name: isMwcStaff ? name.trim() : current.name,
          address: address !== undefined ? (address ? address.trim() : null) : current.address,
          rois_name: rois_name !== undefined ? (rois_name ? rois_name.trim() : null) : current.rois_name,
          leader_name: leader_name !== undefined ? (leader_name ? leader_name.trim() : null) : current.leader_name,
          secretary_name: secretary_name !== undefined ? (secretary_name ? secretary_name.trim() : null) : current.secretary_name,
          contact_no: contact_no !== undefined ? (contact_no ? contact_no.trim() : null) : current.contact_no,
          latitude: latitude !== undefined ? (latitude ? Number(latitude) : null) : current.latitude,
          longitude: longitude !== undefined ? (longitude ? Number(longitude) : null) : current.longitude,
          rois_photo_url: rois_photo_url !== undefined ? (rois_photo_url ? rois_photo_url.trim() : null) : current.rois_photo_url,
          leader_photo_url: leader_photo_url !== undefined ? (leader_photo_url ? leader_photo_url.trim() : null) : current.leader_photo_url,
          secretary_photo_url: secretary_photo_url !== undefined ? (secretary_photo_url ? secretary_photo_url.trim() : null) : current.secretary_photo_url,
          potensi_ekonomi: potensi_ekonomi !== undefined ? (Array.isArray(potensi_ekonomi) ? potensi_ekonomi : []) : current.potensi_ekonomi,
          potensi_unggulan: potensi_unggulan !== undefined ? (potensi_unggulan ? potensi_unggulan.trim() : null) : current.potensi_unggulan,
          updated_at: new Date().toISOString()
        };

        state.rantings[index] = updatedRanting;
        return updatedRanting;
      });

      // Log to audit trail
      db.logActivity(
        user.id,
        user.email,
        'UPDATE_RANTING',
        `Mengubah informasi Ranting "${result.name}" (Kode: ${result.code})`
      );

      res.status(200).json({
        success: true,
        message: `Data Ranting ${result.name} berhasil diperbarui.`,
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Delete a Ranting, guarded by member reference check
   */
  delete: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Role boundary: Only Super Admin, Ketua MWC, Sekretaris can delete a Ranting
    const authorizedRoles = ['Super Admin', 'Ketua MWC', 'Sekretaris'];
    if (!authorizedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anda tidak memiliki wewenang menghapus unit Ranting.'
      });
      return;
    }

    const targetId = Number(req.params.id);
    if (isNaN(targetId)) {
      res.status(400).json({ success: false, message: 'ID Ranting tidak valid.' });
      return;
    }

    try {
      const deletedName = db.transaction((state) => {
        const index = state.rantings.findIndex(r => r.id === targetId);
        if (index === -1) {
          throw new Error('Ranting tidak ditemukan.');
        }

        const ranting = state.rantings[index];

        // Safeguard: Check if there are members registered under this Ranting
        const memberCount = state.anggota.filter(m => m.ranting_id === targetId).length;
        if (memberCount > 0) {
          throw new Error(
            `Tidak dapat menghapus Ranting "${ranting.name}" karena terdapat ${memberCount} warga yang terdaftar di dalamnya. Silakan pindahkan/re-allokasi warga tersebut terlebih dahulu.`
          );
        }

        // Safeguard: Check if there are pengurus registered under this Ranting
        const pengurusCount = state.pengurus.filter(p => p.level === 'Ranting' && p.ranting_id === targetId).length;
        if (pengurusCount > 0) {
          throw new Error(
            `Tidak dapat menghapus Ranting "${ranting.name}" karena terdapat ${pengurusCount} pengurus yang terdaftar di dalamnya. Silakan hapus/pindahkan pengurus tersebut terlebih dahulu.`
          );
        }

        state.rantings.splice(index, 1);
        return ranting.name;
      });

      // Log to audit trail
      db.logActivity(
        user.id,
        user.email,
        'DELETE_RANTING',
        `Menghapus unit Ranting "${deletedName}" (ID: ${targetId})`
      );

      res.status(200).json({
        success: true,
        message: `Ranting "${deletedName}" berhasil dihapus dari sistem.`
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
};
