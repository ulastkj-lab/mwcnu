/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';
import { Keuangan } from '../../db/schema';

export const KeuanganController = {
  /**
   * List all ledger transactions
   */
  list: (req: Request, res: Response): void => {
    const dbState = db.getState();
    const ledger = [...dbState.keuangan].sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );

    // Calculate dynamic totals
    const totalIn = dbState.keuangan
      .filter(k => k.type === 'Masuk')
      .reduce((sum, item) => sum + item.amount, 0);

    const totalOut = dbState.keuangan
      .filter(k => k.type === 'Keluar')
      .reduce((sum, item) => sum + item.amount, 0);

    const balance = totalIn - totalOut;

    res.status(200).json({
      success: true,
      data: {
        transactions: ledger,
        summary: {
          total_income: totalIn,
          total_expense: totalOut,
          current_balance: balance
        }
      }
    });
  },

  /**
   * Log a cash transaction (Income / Expense)
   */
  create: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Role boundaries: Only Bendahara, Super Admin, and Operator can input financial ledger entries
    if (!['Bendahara', 'Super Admin', 'Operator'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hanya Bendahara MWC atau administrator yang diperkenankan mencatatkan transaksi keuangan.'
      });
      return;
    }

    const { type, category, amount, transaction_date, description } = req.body;

    if (!type || !category || !amount || !transaction_date) {
      res.status(400).json({ success: false, message: 'Data transaksi belum lengkap.' });
      return;
    }

    try {
      const result = db.transaction((state) => {
        const id = state.keuangan.length > 0 ? Math.max(...state.keuangan.map(k => k.id)) + 1 : 1;

        const newTx: Keuangan = {
          id,
          type: type as any,
          category,
          amount: Number(amount),
          transaction_date,
          description: description || null,
          proof_file_url: null,
          created_by_uid: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        state.keuangan.push(newTx);
        return newTx;
      });

      res.status(201).json({
        success: true,
        message: 'Transaksi kas keuangan berhasil dibukukan.',
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
};
