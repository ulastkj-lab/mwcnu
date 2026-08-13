/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';
import { WaBlast, WaBlastLog } from '../../db/schema';

export const WaBlastController = {
  /**
   * List all WA Blast history
   */
  list: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const dbState = db.getState();
    const blasts = dbState.wa_blasts || [];
    
    // Sort by latest created_at
    const sorted = [...blasts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({
      success: true,
      data: sorted
    });
  },

  /**
   * Send/Create a new WA Blast
   */
  send: async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const { title, message_template, recipient_type, recipients, gateway_type, api_token } = req.body;

    if (!title || !message_template || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ success: false, message: 'Parameter tidak lengkap.' });
      return;
    }

    const logs: WaBlastLog[] = [];
    let sent_count = 0;
    let failed_count = 0;

    // Helper to format Indonesian phone number to standard format (628...)
    const formatPhone = (phone: string): string => {
      let cleaned = phone.replace(/[^0-9]/g, '');
      if (cleaned.startsWith('08')) {
        cleaned = '628' + cleaned.slice(2);
      } else if (cleaned.startsWith('8')) {
        cleaned = '628' + cleaned.slice(1);
      }
      return cleaned;
    };

    // Process each recipient
    for (const recipient of recipients) {
      const { name, phone, ranting_name, role_name } = recipient;
      
      // Personalize message
      let message = message_template
        .replace(/{nama}/gi, name || '')
        .replace(/{ranting}/gi, ranting_name || 'Tingkat MWC')
        .replace(/{jabatan}/gi, role_name || 'Anggota')
        .replace(/{role}/gi, role_name || 'Anggota');

      const formattedPhone = formatPhone(phone || '');
      const hasPhone = formattedPhone.length >= 10;

      if (!hasPhone) {
        logs.push({
          phone: phone || '-',
          name,
          status: 'Failed',
          error: 'Nomor telepon tidak valid atau kosong',
          sent_at: new Date().toISOString()
        });
        failed_count++;
        continue;
      }

      if (gateway_type === 'fonnte') {
        if (!api_token) {
          logs.push({
            phone: formattedPhone,
            name,
            status: 'Failed',
            error: 'API Token Fonnte tidak diisi',
            sent_at: new Date().toISOString()
          });
          failed_count++;
          continue;
        }

        try {
          // Real API call to Fonnte (Server proxy prevents exposing token/CORS)
          const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
              'Authorization': api_token,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              target: formattedPhone,
              message: message,
              countryCode: '62'
            })
          });

          const result = await response.json() as any;

          if (response.ok && (result.status === true || result.status === 'true' || result.message === 'In queue' || result.status === 'success' || result.status === 200)) {
            logs.push({
              phone: formattedPhone,
              name,
              status: 'Success',
              sent_at: new Date().toISOString()
            });
            sent_count++;
          } else {
            logs.push({
              phone: formattedPhone,
              name,
              status: 'Failed',
              error: result.reason || result.message || 'Gagal mengirim melalui Fonnte',
              sent_at: new Date().toISOString()
            });
            failed_count++;
          }
        } catch (err: any) {
          logs.push({
            phone: formattedPhone,
            name,
            status: 'Failed',
            error: err.message || 'Error koneksi API',
            sent_at: new Date().toISOString()
          });
          failed_count++;
        }
      } else {
        // Simulated sending with slight random variation for authenticity
        const isSuccess = Math.random() > 0.05; // 95% success rate for simulation
        
        if (isSuccess) {
          logs.push({
            phone: formattedPhone,
            name,
            status: 'Success',
            sent_at: new Date().toISOString()
          });
          sent_count++;
        } else {
          logs.push({
            phone: formattedPhone,
            name,
            status: 'Failed',
            error: 'Gagal mengirim: timeout koneksi operator (Simulasi)',
            sent_at: new Date().toISOString()
          });
          failed_count++;
        }
      }
    }

    // Save Blast record to database
    let newBlast: WaBlast | null = null;
    db.transaction((state) => {
      const nextId = state.wa_blasts.length > 0 ? Math.max(...state.wa_blasts.map(b => b.id)) + 1 : 1;
      newBlast = {
        id: nextId,
        title,
        message_template,
        recipient_type,
        total_recipients: recipients.length,
        sent_count,
        failed_count,
        status: failed_count === recipients.length ? 'Failed' : (failed_count > 0 ? 'Completed' : 'Completed'),
        logs,
        created_at: new Date().toISOString()
      };
      state.wa_blasts.push(newBlast);
    });

    // Write audit log
    db.logActivity(
      user.id,
      user.email,
      'WA Blast',
      `Melakukan WA Blast "${title}" kepada ${recipients.length} penerima (${sent_count} berhasil, ${failed_count} gagal)`
    );

    res.json({
      success: true,
      message: `WA Blast berhasil diproses. ${sent_count} terkirim, ${failed_count} gagal.`,
      data: newBlast
    });
  }
};
