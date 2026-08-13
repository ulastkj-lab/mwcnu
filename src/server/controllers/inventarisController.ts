/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';
import { Inventaris, InventarisLoan } from '../../db/schema';

export const InventarisController = {
  /**
   * List all asset items and their status
   */
  list: (req: Request, res: Response): void => {
    const dbState = db.getState();
    const assets = [...dbState.inventaris];
    const loans = [...dbState.inventaris_loan];

    // Map active loans to each item
    const assetsWithStatus = assets.map(asset => {
      const activeLoan = loans.find(l => l.inventaris_id === asset.id && l.status === 'Dipinjam');
      return {
        ...asset,
        loan_status: activeLoan ? 'Dipinjam' : 'Tersedia',
        active_loan: activeLoan || null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        assets: assetsWithStatus,
        loans
      }
    });
  },

  /**
   * Log an asset registration
   */
  create: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    if (!['Super Admin', 'Sekretaris', 'Operator'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hanya Sekretariat MWC atau administrator yang diperkenankan mendaftarkan aset baru.'
      });
      return;
    }

    const { code, name, category, location, condition, quantity, photo_url, notes } = req.body;

    if (!code || !name || !category || !location) {
      res.status(400).json({ success: false, message: 'Formulir belum lengkap.' });
      return;
    }

    try {
      const result = db.transaction((state) => {
        // Guard duplicate code
        const codeExists = state.inventaris.some(i => i.code.toLowerCase() === code.toLowerCase());
        if (codeExists) {
          throw new Error(`Kode barang ${code} sudah didaftarkan.`);
        }

        const id = state.inventaris.length > 0 ? Math.max(...state.inventaris.map(i => i.id)) + 1 : 1;
        const parsedQuantity = quantity && !isNaN(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;

        const newItem: Inventaris = {
          id,
          code,
          name,
          category,
          location,
          condition: (condition as any) || 'Baik',
          quantity: parsedQuantity,
          photo_url: photo_url || null,
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        state.inventaris.push(newItem);
        return newItem;
      });

      res.status(201).json({
        success: true,
        message: 'Barang inventaris baru berhasil diregistrasikan.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Log a new loan entry
   */
  loan: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const { inventaris_id, borrower_name, borrower_phone, loan_date, expected_return_date, notes } = req.body;

    if (!inventaris_id || !borrower_name || !loan_date || !expected_return_date) {
      res.status(400).json({ success: false, message: 'Informasi peminjaman wajib diisi lengkap.' });
      return;
    }

    try {
      const result = db.transaction((state) => {
        // Check if item is already on active loan
        const itemOnLoan = state.inventaris_loan.some(l => l.inventaris_id === Number(inventaris_id) && l.status === 'Dipinjam');
        if (itemOnLoan) {
          throw new Error('Barang sedang dipinjam dan belum dikembalikan.');
        }

        const id = state.inventaris_loan.length > 0 ? Math.max(...state.inventaris_loan.map(l => l.id)) + 1 : 1;

        const newLoan: InventarisLoan = {
          id,
          inventaris_id: Number(inventaris_id),
          borrower_name,
          borrower_phone: borrower_phone || null,
          borrower_institution: null,
          loan_date,
          estimated_return_date: expected_return_date || null,
          actual_return_date: null,
          condition_on_loan: null,
          condition_on_return: null,
          status: 'Dipinjam',
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        state.inventaris_loan.push(newLoan);
        return newLoan;
      });

      res.status(201).json({
        success: true,
        message: 'Peminjaman inventaris berhasil dicatatkan.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Return an on-loan item
   */
  returnItem: (req: Request, res: Response): void => {
    const { id } = req.params; // loan_id

    try {
      const result = db.transaction((state) => {
        const loan = state.inventaris_loan.find(l => l.id === Number(id));
        if (!loan) {
          throw new Error('Log peminjaman tidak ditemukan.');
        }

        if (loan.status === 'Kembali') {
          throw new Error('Barang sudah dikembalikan sebelumnya.');
        }

        loan.status = 'Kembali';
        loan.actual_return_date = new Date().toISOString().split('T')[0];
        loan.updated_at = new Date().toISOString();

        return loan;
      });

      res.status(200).json({
        success: true,
        message: 'Barang inventaris berhasil dikembalikan ke gudang.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
};
