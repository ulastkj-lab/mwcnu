/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';
import { MwcSettings } from '../../db/schema';

export const SettingsController = {
  /**
   * Get current MWC settings
   */
  get: (req: Request, res: Response): void => {
    const dbState = db.getState();
    
    // In case settings are not initialized yet, fallback to a sensible default
    const settings = dbState.settings || {
      name: 'MWC NU Karangpawitan',
      logo_url: '/uploads/nahdlatul_ulama_logo.svg',
      structure: {
        mustasyar: [],
        syuriah: { rais: '', wakil_rais: [], katib: '', wakil_katib: [], a_wan: [] },
        tanfidziyah: { ketua: '', wakil_ketua: [], sekretaris: '', wakil_sekretaris: [], bendahara: '', wakil_bendahara: [] }
      },
      social_media: {
        facebook: 'https://facebook.com/mwcnukarangpawitan',
        instagram: 'https://instagram.com/mwcnu_karangpawitan',
        youtube: 'https://youtube.com/@mwcnukarangpawitan',
        tiktok: 'https://tiktok.com/@mwcnukarangpawitan',
        whatsapp: 'https://wa.me/6281234567890',
        website: 'https://mwcnukarangpawitan.or.id'
      },
      leadership_photos: {
        rois_photo_url: null,
        katib_photo_url: null,
        ketua_photo_url: null,
        sekretaris_photo_url: null
      }
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  },

  /**
   * Update MWC settings (Super Admin side)
   */
  update: (req: Request, res: Response): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Role boundary: Only Super Admin, Ketua MWC, or Sekretaris can modify settings
    const authorizedRoles = ['Super Admin', 'Ketua MWC', 'Sekretaris'];
    if (!authorizedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk memperbarui pengaturan MWC NU.'
      });
      return;
    }

    const { name, logo_url, structure, social_media, leadership_photos } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ success: false, message: 'Nama MWC NU wajib diisi.' });
      return;
    }

    try {
      db.transaction((state) => {
        state.settings = {
          name: name.trim(),
          logo_url: logo_url || null,
          structure: structure || {
            mustasyar: [],
            syuriah: { rais: '', wakil_rais: [], katib: '', wakil_katib: [], a_wan: [] },
            tanfidziyah: { ketua: '', wakil_ketua: [], sekretaris: '', wakil_sekretaris: [], bendahara: '', wakil_bendahara: [] }
          },
          social_media: social_media || state.settings?.social_media || {
            facebook: '',
            instagram: '',
            youtube: '',
            tiktok: '',
            whatsapp: '',
            website: ''
          },
          leadership_photos: leadership_photos || state.settings?.leadership_photos || {
            rois_photo_url: null,
            katib_photo_url: null,
            ketua_photo_url: null,
            sekretaris_photo_url: null
          }
        };
      });

      // Log activity
      db.logActivity(
        user.id,
        user.email,
        'UPDATE_MWC_SETTINGS',
        `Memperbarui konfigurasi identitas MWC NU: ${name}`
      );

      res.status(200).json({
        success: true,
        message: 'Pengaturan MWC NU berhasil diperbarui!',
        data: db.getState().settings
      });
    } catch (err: any) {
      console.error('Update settings error:', err);
      res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan: ' + err.message });
    }
  }
};
