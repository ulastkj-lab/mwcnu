/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/db';
import { AuthController } from './src/server/controllers/authController';
import { SensusController } from './src/server/controllers/sensusController';
import { KeuanganController } from './src/server/controllers/keuanganController';
import { InventarisController } from './src/server/controllers/inventarisController';
import { AuditController } from './src/server/controllers/auditController';
import { RantingController, enrichRantingData } from './src/server/controllers/rantingController';
import { WaBlastController } from './src/server/controllers/waBlastController';
import { SettingsController } from './src/server/controllers/settingsController';
import { BanomController } from './src/server/controllers/banomController';
import { FirebaseController } from './src/server/controllers/firebaseController';
import { requireAuth } from './src/server/middleware/auth';
import { auditLogger } from './src/server/middleware/auditLog';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware with 10MB limit for base64 image uploads
  app.use(express.json({ limit: '10mb' }));
  
  // Create uploads directory if it does not exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded images statically
  app.use('/uploads', express.static(uploadsDir));

  // Custom middleware to automatically register audits on data changes
  app.use(auditLogger);

  // ==========================================
  // API ROUTING (REPLICA: routes/api.php)
  // ==========================================

  // Authentication Scaffolding (Laravel Breeze Equivalent)
  app.post('/api/auth/login', AuthController.login);
  app.get('/api/auth/me', requireAuth, AuthController.me);
  app.get('/api/auth/demo-users', AuthController.getDemoUsers);
  app.post('/api/auth/logout', requireAuth, AuthController.logout);
  app.post('/api/auth/change-password', requireAuth, AuthController.changePassword);

  // User Management routes for Super Admin
  app.get('/api/users', requireAuth, AuthController.listUsers);
  app.post('/api/users', requireAuth, AuthController.createUser);
  app.put('/api/users/:id', requireAuth, AuthController.updateUser);
  app.delete('/api/users/:id', requireAuth, AuthController.deleteUser);

  // ==========================================
  // ADMIN & SECURE SYSTEM ENDPOINTS
  // ==========================================
  app.get('/api/sensus', requireAuth, SensusController.list);
  app.get('/api/potensi', requireAuth, SensusController.listPotensi);
  app.post('/api/sensus', requireAuth, SensusController.create);
  app.post('/api/sensus/:id/verify', requireAuth, SensusController.verify);
  app.put('/api/sensus/:id', requireAuth, SensusController.update);
  app.delete('/api/sensus/:id', requireAuth, SensusController.delete);

  app.get('/api/keuangan', requireAuth, KeuanganController.list);
  app.post('/api/keuangan', requireAuth, KeuanganController.create);

  app.get('/api/inventaris', requireAuth, InventarisController.list);
  app.post('/api/inventaris', requireAuth, InventarisController.create);
  app.post('/api/inventaris/loan', requireAuth, InventarisController.loan);
  app.post('/api/inventaris/loans/:id/return', requireAuth, InventarisController.returnItem);

  app.get('/api/audit-logs', requireAuth, AuditController.list);

  app.get('/api/rantings', requireAuth, RantingController.list);
  app.get('/api/banoms', requireAuth, BanomController.list);
  app.get('/api/banoms/:id', requireAuth, BanomController.getById);
  app.post('/api/banoms', requireAuth, BanomController.create);
  app.put('/api/banoms/:id', requireAuth, BanomController.update);
  app.delete('/api/banoms/:id', requireAuth, BanomController.delete);
  app.post('/api/banoms/:id/pengurus', requireAuth, BanomController.addPengurus);
  app.delete('/api/pengurus/:pengurusId', requireAuth, BanomController.deletePengurus);
  app.post('/api/rantings', requireAuth, RantingController.create);
  app.put('/api/rantings/:id', requireAuth, RantingController.update);
  app.delete('/api/rantings/:id', requireAuth, RantingController.delete);

  // MWC settings routes
  app.get('/api/settings', requireAuth, SettingsController.get);
  app.put('/api/settings', requireAuth, SettingsController.update);

  // Firebase Integration routes
  app.get('/api/firebase/status', requireAuth, FirebaseController.getStatus);
  app.post('/api/firebase/backup', requireAuth, FirebaseController.backup);
  app.post('/api/firebase/restore', requireAuth, FirebaseController.restore);

  // File Upload Endpoint for Ranting Photos (Base64 handler)
  app.post('/api/upload', requireAuth, (req, res) => {
    try {
      const { image, filename } = req.body;
      if (!image) {
        res.status(400).json({ success: false, message: 'Tidak ada data gambar.' });
        return;
      }

      // Match base64 pattern (e.g. data:image/png;base64,...)
      const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ success: false, message: 'Format data gambar tidak valid.' });
        return;
      }

      const rawExtension = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Map raw content-type style extension to actual safe extension
      let extension = rawExtension;
      if (rawExtension === 'jpeg') extension = 'jpg';
      if (rawExtension === 'svg+xml') extension = 'svg';

      const sanitizedFilename = (filename || 'photo')
        .replace(/[^a-zA-Z0-9_\-.]/g, '_')
        .substring(0, 100);
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;

      const filePath = path.join(path.join(process.cwd(), 'uploads'), uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      const relativeUrl = `/uploads/${uniqueFilename}`;

      res.status(200).json({
        success: true,
        message: 'Foto berhasil diunggah.',
        url: relativeUrl
      });
    } catch (err: any) {
      console.error('Error uploading file:', err);
      res.status(500).json({ success: false, message: 'Gagal mengunggah foto: ' + err.message });
    }
  });

  // WA Blast Endpoints
  app.get('/api/wa-blasts', requireAuth, WaBlastController.list);
  app.post('/api/wa-blasts/send', requireAuth, WaBlastController.send);

  // ==========================================
  // PUBLIC WEBSITE ENDPOINTS
  // ==========================================
  app.get('/api/public/settings', SettingsController.get);

  app.get('/api/public/rantings', (req, res) => {
    const dbState = db.getState();
    const rantings = dbState.rantings || [];
    const enriched = rantings.map(r => enrichRantingData(r, dbState));
    res.json({ success: true, data: enriched });
  });

  app.get('/api/public/stats', (req, res) => {
    const dbState = db.getState();
    const members = dbState.anggota || [];
    const approved = members.filter(m => m.status_sensus === 'Disetujui').length;
    res.json({
      success: true,
      data: {
        members: members.length,
        rantingsCount: dbState.rantings ? dbState.rantings.length : 20,
        banomsCount: dbState.banoms ? dbState.banoms.length : 10,
        approvedCount: approved
      }
    });
  });

  app.get('/api/public/check-sensus', (req, res) => {
    const { nik } = req.query;
    if (!nik) {
      res.status(400).json({ success: false, message: 'NIK tidak valid.' });
      return;
    }
    const dbState = db.getState();
    const citizen = dbState.anggota.find(m => m.nik === String(nik));
    if (!citizen) {
      res.status(404).json({ success: false, message: 'NIK tidak ditemukan dalam basis data sensus.' });
      return;
    }
    const ranting = dbState.rantings.find(r => r.id === citizen.ranting_id);
    res.json({
      success: true,
      data: {
        name: citizen.name,
        ranting: ranting ? ranting.name : 'Ranting Umum',
        status: citizen.status_sensus,
        kta_number: citizen.kta_number,
        year_joined: citizen.year_joined
      }
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: 'SIM MWC NU Karangpawitan API'
    });
  });

  // ==========================================
  // STATIC ASSETS / FRONTEND SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Integrate Vite as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode.');
  } else {
    // Production mode: Serve pre-built static client files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving compiled static SPA files in production mode.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🟢 SIM MWC NU SERVER RUNNING ON http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch((error) => {
  console.error('Fatal error during server startup:', error);
});
