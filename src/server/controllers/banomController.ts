import { Request, Response } from 'express';
import { db } from '../../db/db';
import { Banom, Pengurus } from '../../db/schema';

export const BanomController = {
  /**
   * List all Banom & Lembaga with aggregated counts
   */
  list: (req: Request, res: Response): void => {
    try {
      const dbState = db.getState();
      const { type, search } = req.query;

      let list = [...(dbState.banoms || [])];

      if (type && (type === 'Banom' || type === 'Lembaga')) {
        list = list.filter(b => b.type === type);
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        list = list.filter(b => 
          b.name.toLowerCase().includes(query) ||
          (b.leader_name && b.leader_name.toLowerCase().includes(query)) ||
          (b.sk_number && b.sk_number.toLowerCase().includes(query))
        );
      }

      // Enrich with pengurus count and anggota count
      const enriched = list.map(b => {
        const pengurusCount = (dbState.pengurus || []).filter(p => p.level === 'Banom' && p.banom_id === b.id).length;
        const anggotaCount = (dbState.anggota || []).filter(a => a.banom_id === b.id).length;
        return {
          ...b,
          pengurus_count: pengurusCount,
          anggota_count: anggotaCount
        };
      });

      res.status(200).json({
        success: true,
        data: enriched
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal mengambil data Banom/Lembaga.' });
    }
  },

  /**
   * Get single Banom/Lembaga by ID with full structure
   */
  getById: (req: Request, res: Response): void => {
    try {
      const dbState = db.getState();
      const id = Number(req.params.id);
      const banom = (dbState.banoms || []).find(b => b.id === id);

      if (!banom) {
        res.status(404).json({ success: false, message: 'Banom / Lembaga tidak ditemukan.' });
        return;
      }

      const pengurusList = (dbState.pengurus || []).filter(p => p.level === 'Banom' && p.banom_id === id);
      const membersList = (dbState.anggota || []).filter(a => a.banom_id === id);

      res.status(200).json({
        success: true,
        data: {
          ...banom,
          pengurus: pengurusList,
          anggota_count: membersList.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal mengambil rincian Banom/Lembaga.' });
    }
  },

  /**
   * Create new Banom or Lembaga
   */
  create: (req: Request, res: Response): void => {
    try {
      const {
        name, type, code, leader_name, secretary_name, treasurer_name,
        contact_no, address, description, sk_number, sk_file_url, sk_date,
        period_start, period_end, logo_url
      } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, message: 'Nama Banom / Lembaga wajib diisi.' });
        return;
      }

      if (!type || (type !== 'Banom' && type !== 'Lembaga')) {
        res.status(400).json({ success: false, message: 'Tipe organisasi harus berupa "Banom" atau "Lembaga".' });
        return;
      }

      const now = new Date().toISOString();
      const newBanom: Banom = db.transaction(state => {
        if (!state.banoms) state.banoms = [];

        const nextId = state.banoms.length > 0 ? Math.max(...state.banoms.map(b => b.id)) + 1 : 1;
        const item: Banom = {
          id: nextId,
          name: name.trim(),
          type,
          code: code ? code.trim() : null,
          leader_name: leader_name ? leader_name.trim() : null,
          secretary_name: secretary_name ? secretary_name.trim() : null,
          treasurer_name: treasurer_name ? treasurer_name.trim() : null,
          contact_no: contact_no ? contact_no.trim() : null,
          address: address ? address.trim() : null,
          description: description ? description.trim() : null,
          sk_number: sk_number ? sk_number.trim() : null,
          sk_file_url: sk_file_url ? sk_file_url.trim() : null,
          sk_date: sk_date ? sk_date.trim() : null,
          period_start: period_start ? Number(period_start) : new Date().getFullYear(),
          period_end: period_end ? Number(period_end) : new Date().getFullYear() + 5,
          logo_url: logo_url ? logo_url.trim() : null,
          created_at: now,
          updated_at: now
        };

        state.banoms.push(item);

        // Auto-create initial pengurus records for Ketua, Sekretaris, Bendahara if provided
        if (!state.pengurus) state.pengurus = [];
        const pStart = item.period_start || new Date().getFullYear();
        const pEnd = item.period_end || (pStart + 5);

        if (item.leader_name) {
          const maxPId = state.pengurus.length > 0 ? Math.max(...state.pengurus.map(p => p.id)) + 1 : 1;
          state.pengurus.push({
            id: maxPId,
            anggota_id: null,
            name: item.leader_name,
            photo_url: null,
            level: 'Banom',
            ranting_id: null,
            banom_id: item.id,
            position: 'Ketua / Kepala Lembaga',
            sk_number: item.sk_number,
            sk_file_url: item.sk_file_url,
            period_start: pStart,
            period_end: pEnd,
            status: 'Aktif',
            created_at: now,
            updated_at: now
          });
        }

        if (item.secretary_name) {
          const maxPId = state.pengurus.length > 0 ? Math.max(...state.pengurus.map(p => p.id)) + 1 : 1;
          state.pengurus.push({
            id: maxPId,
            anggota_id: null,
            name: item.secretary_name,
            photo_url: null,
            level: 'Banom',
            ranting_id: null,
            banom_id: item.id,
            position: 'Sekretaris',
            sk_number: item.sk_number,
            sk_file_url: item.sk_file_url,
            period_start: pStart,
            period_end: pEnd,
            status: 'Aktif',
            created_at: now,
            updated_at: now
          });
        }

        if (item.treasurer_name) {
          const maxPId = state.pengurus.length > 0 ? Math.max(...state.pengurus.map(p => p.id)) + 1 : 1;
          state.pengurus.push({
            id: maxPId,
            anggota_id: null,
            name: item.treasurer_name,
            photo_url: null,
            level: 'Banom',
            ranting_id: null,
            banom_id: item.id,
            position: 'Bendahara',
            sk_number: item.sk_number,
            sk_file_url: item.sk_file_url,
            period_start: pStart,
            period_end: pEnd,
            status: 'Aktif',
            created_at: now,
            updated_at: now
          });
        }

        return item;
      });

      res.status(201).json({
        success: true,
        message: `${type} "${newBanom.name}" berhasil ditambahkan.`,
        data: newBanom
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal menambahkan Banom/Lembaga.' });
    }
  },

  /**
   * Update existing Banom or Lembaga
   */
  update: (req: Request, res: Response): void => {
    try {
      const id = Number(req.params.id);
      const {
        name, type, code, leader_name, secretary_name, treasurer_name,
        contact_no, address, description, sk_number, sk_file_url, sk_date,
        period_start, period_end, logo_url
      } = req.body;

      const updatedBanom = db.transaction(state => {
        if (!state.banoms) state.banoms = [];
        const index = state.banoms.findIndex(b => b.id === id);
        if (index === -1) return null;

        const current = state.banoms[index];
        const now = new Date().toISOString();

        const updated: Banom = {
          ...current,
          name: name !== undefined ? name.trim() : current.name,
          type: type !== undefined ? type : current.type,
          code: code !== undefined ? (code ? code.trim() : null) : current.code,
          leader_name: leader_name !== undefined ? (leader_name ? leader_name.trim() : null) : current.leader_name,
          secretary_name: secretary_name !== undefined ? (secretary_name ? secretary_name.trim() : null) : current.secretary_name,
          treasurer_name: treasurer_name !== undefined ? (treasurer_name ? treasurer_name.trim() : null) : current.treasurer_name,
          contact_no: contact_no !== undefined ? (contact_no ? contact_no.trim() : null) : current.contact_no,
          address: address !== undefined ? (address ? address.trim() : null) : current.address,
          description: description !== undefined ? (description ? description.trim() : null) : current.description,
          sk_number: sk_number !== undefined ? (sk_number ? sk_number.trim() : null) : current.sk_number,
          sk_file_url: sk_file_url !== undefined ? (sk_file_url ? sk_file_url.trim() : null) : current.sk_file_url,
          sk_date: sk_date !== undefined ? (sk_date ? sk_date.trim() : null) : current.sk_date,
          period_start: period_start !== undefined ? Number(period_start) : current.period_start,
          period_end: period_end !== undefined ? Number(period_end) : current.period_end,
          logo_url: logo_url !== undefined ? (logo_url ? logo_url.trim() : null) : current.logo_url,
          updated_at: now
        };

        state.banoms[index] = updated;
        return updated;
      });

      if (!updatedBanom) {
        res.status(404).json({ success: false, message: 'Banom/Lembaga tidak ditemukan.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Data ${updatedBanom.type} "${updatedBanom.name}" berhasil diperbarui.`,
        data: updatedBanom
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui Banom/Lembaga.' });
    }
  },

  /**
   * Delete Banom/Lembaga
   */
  delete: (req: Request, res: Response): void => {
    try {
      const id = Number(req.params.id);

      const dbState = db.getState();
      const banom = (dbState.banoms || []).find(b => b.id === id);

      if (!banom) {
        res.status(404).json({ success: false, message: 'Banom/Lembaga tidak ditemukan.' });
        return;
      }

      // Safeguard: Check if members exist under this Banom
      const membersCount = (dbState.anggota || []).filter(a => a.banom_id === id).length;
      if (membersCount > 0) {
        res.status(400).json({
          success: false,
          message: `Tidak dapat menghapus ${banom.type} "${banom.name}" karena masih ada ${membersCount} warga terdaftar di bawah organisasi ini.`
        });
        return;
      }

      db.transaction(state => {
        state.banoms = (state.banoms || []).filter(b => b.id !== id);
        // Also remove associated pengurus
        if (state.pengurus) {
          state.pengurus = state.pengurus.filter(p => !(p.level === 'Banom' && p.banom_id === id));
        }
      });

      res.status(200).json({
        success: true,
        message: `${banom.type} "${banom.name}" berhasil dihapus.`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal menghapus Banom/Lembaga.' });
    }
  },

  /**
   * Add a Pengurus member to a Banom/Lembaga
   */
  addPengurus: (req: Request, res: Response): void => {
    try {
      const banomId = Number(req.params.id);
      const { anggota_id, name, position, photo_url, period_start, period_end, sk_number, sk_file_url, status } = req.body;

      if (!position || typeof position !== 'string' || !position.trim()) {
        res.status(400).json({ success: false, message: 'Jabatan pengurus wajib diisi.' });
        return;
      }

      const dbState = db.getState();
      const banom = (dbState.banoms || []).find(b => b.id === banomId);

      if (!banom) {
        res.status(404).json({ success: false, message: 'Banom/Lembaga tidak ditemukan.' });
        return;
      }

      let personName = name ? name.trim() : '';
      let personPhoto = photo_url ? photo_url.trim() : null;

      if (anggota_id) {
        const member = (dbState.anggota || []).find(a => a.id === Number(anggota_id));
        if (member) {
          personName = member.name;
          personPhoto = member.photo_url || personPhoto;
        }
      }

      if (!personName) {
        res.status(400).json({ success: false, message: 'Nama pengurus wajib diisi atau pilih dari Sensus Warga.' });
        return;
      }

      const now = new Date().toISOString();
      const newPengurus: Pengurus = db.transaction(state => {
        if (!state.pengurus) state.pengurus = [];

        const nextId = state.pengurus.length > 0 ? Math.max(...state.pengurus.map(p => p.id)) + 1 : 1;
        const item: Pengurus = {
          id: nextId,
          anggota_id: anggota_id ? Number(anggota_id) : null,
          name: personName,
          photo_url: personPhoto,
          level: 'Banom',
          ranting_id: null,
          banom_id: banomId,
          position: position.trim(),
          sk_number: sk_number ? sk_number.trim() : (banom.sk_number || null),
          sk_file_url: sk_file_url ? sk_file_url.trim() : (banom.sk_file_url || null),
          period_start: period_start ? Number(period_start) : (banom.period_start || new Date().getFullYear()),
          period_end: period_end ? Number(period_end) : (banom.period_end || new Date().getFullYear() + 5),
          status: status || 'Aktif',
          created_at: now,
          updated_at: now
        };

        state.pengurus.push(item);
        return item;
      });

      res.status(201).json({
        success: true,
        message: `Pengurus "${newPengurus.name}" sebagai ${newPengurus.position} berhasil ditambahkan.`,
        data: newPengurus
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal menambahkan pengurus.' });
    }
  },

  /**
   * Delete a Pengurus member from a Banom/Lembaga
   */
  deletePengurus: (req: Request, res: Response): void => {
    try {
      const pengurusId = Number(req.params.pengurusId);

      const dbState = db.getState();
      const existing = (dbState.pengurus || []).find(p => p.id === pengurusId);

      if (!existing) {
        res.status(404).json({ success: false, message: 'Pengurus tidak ditemukan.' });
        return;
      }

      db.transaction(state => {
        state.pengurus = (state.pengurus || []).filter(p => p.id !== pengurusId);
      });

      res.status(200).json({
        success: true,
        message: `Pengurus "${existing.name}" berhasil dihapus dari struktur.`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal menghapus pengurus.' });
    }
  }
};
