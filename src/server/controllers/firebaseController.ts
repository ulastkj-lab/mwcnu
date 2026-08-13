/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { db } from '../../db/db';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load configuration safely
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

function getFirebaseConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading firebase config file:', error);
  }
  return null;
}

// Lazy initialization of Firebase
function getFirestoreInstance() {
  const config = getFirebaseConfig();
  if (!config) {
    throw new Error('Konfigurasi Firebase belum dibuat di server. Silakan hubungi administrator.');
  }

  const app = getApps().length === 0 ? initializeApp(config) : getApp();
  return getFirestore(app, config.firestoreDatabaseId);
}

export const FirebaseController = {
  /**
   * Get Firebase Integration Status
   */
  getStatus: async (req: Request, res: Response): Promise<void> => {
    const config = getFirebaseConfig();
    if (!config) {
      res.status(200).json({
        success: true,
        data: {
          connected: false,
          configured: false,
          message: 'Firebase belum dikonfigurasi. Hubungi Admin untuk melakukan setup.'
        }
      });
      return;
    }

    try {
      const firestore = getFirestoreInstance();
      // Try to read a dummy document to verify if rules are locked
      const testDocRef = doc(firestore, 'test_connection', 'ping_client');
      let rulesLocked = false;
      let errorMsg = '';

      try {
        await getDoc(testDocRef);
      } catch (err: any) {
        if (err.code === 'permission-denied') {
          rulesLocked = true;
          errorMsg = err.message;
        }
      }

      // Check last backup timestamp from our DB settings/metadata or write_blasts
      const dbState = db.getState();
      const lastBackup = (dbState as any).last_firebase_backup || null;

      res.status(200).json({
        success: true,
        data: {
          connected: true,
          configured: true,
          projectId: config.projectId,
          databaseId: config.firestoreDatabaseId,
          rulesLocked,
          lastBackup,
          error: errorMsg,
          message: rulesLocked
            ? 'Terhubung ke Firebase Cloud, tetapi akses ditolak oleh Aturan Keamanan (Firestore Rules).'
            : 'Sistem Terhubung Penuh dan Sinkronisasi Cloud Aktif!'
        }
      });
    } catch (error: any) {
      console.error('Error checking Firebase status:', error);
      res.status(200).json({
        success: true,
        data: {
          connected: false,
          configured: true,
          projectId: config.projectId,
          message: 'Gagal terhubung ke Firestore: ' + error.message
        }
      });
    }
  },

  /**
   * Sync/Backup local database to Firestore
   */
  backup: async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Role gate: Only Admin types can back up
    const authorizedRoles = ['Super Admin', 'Ketua MWC', 'Sekretaris', 'Bendahara', 'Operator'];
    if (!authorizedRoles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'Akses Ditolak: Anda tidak memiliki wewenang.' });
      return;
    }

    try {
      const firestore = getFirestoreInstance();
      const state = db.getState();

      // Collections we want to backup
      const collectionsToBackup = [
        { name: 'rantings', data: state.rantings },
        { name: 'banoms', data: state.banoms },
        { name: 'users', data: state.users },
        { name: 'anggota', data: state.anggota },
        { name: 'anggota_pendidikan', data: state.anggota_pendidikan },
        { name: 'anggota_pekerjaan', data: state.anggota_pekerjaan },
        { name: 'potensi', data: state.potensi },
        { name: 'anggota_potensi', data: state.anggota_potensi },
        { name: 'pengurus', data: state.pengurus },
        { name: 'surat', data: state.surat },
        { name: 'disposisi', data: state.disposisi },
        { name: 'agenda', data: state.agenda },
        { name: 'agenda_attendance', data: state.agenda_attendance },
        { name: 'inventaris', data: state.inventaris },
        { name: 'inventaris_loan', data: state.inventaris_loan },
        { name: 'keuangan', data: state.keuangan },
        { name: 'news', data: state.news },
        { name: 'gallery', data: state.gallery },
        { name: 'guest_book', data: state.guest_book },
        { name: 'audit_logs', data: state.audit_logs },
        { name: 'settings', data: state.settings ? [state.settings] : [] }
      ];

      console.log('Starting backup to Firebase Firestore...');

      // Save each table's metadata/records
      for (const col of collectionsToBackup) {
        if (!col.data || col.data.length === 0) continue;
        
        // Save collection count and status
        const metaDocRef = doc(firestore, 'database_metadata', col.name);
        await setDoc(metaDocRef, {
          name: col.name,
          count: col.data.length,
          lastUpdated: new Date().toISOString()
        });

        // Save records as documents
        for (const item of col.data) {
          const docId = (item as any).id ? String((item as any).id) : `doc_${Math.random().toString(36).substring(2, 9)}`;
          const docRef = doc(firestore, col.name, docId);
          await setDoc(docRef, item);
        }
      }

      // Record last backup timestamp in local database
      const backupTime = new Date().toISOString();
      db.transaction((localState: any) => {
        localState.last_firebase_backup = backupTime;
      });

      db.logActivity(
        user.id,
        user.email,
        'FIREBASE_BACKUP',
        'Berhasil melakukan pencadangan (backup) seluruh database ke Firebase Firestore'
      );

      res.status(200).json({
        success: true,
        message: 'Cadangan database berhasil diunggah ke Firebase Firestore!',
        timestamp: backupTime
      });
    } catch (error: any) {
      console.error('Backup to Firebase failed:', error);
      
      let friendlyMessage = 'Gagal melakukan pencadangan: ' + error.message;
      if (error.code === 'permission-denied') {
        friendlyMessage = 'Gagal menyimpan ke Cloud: Aturan Keamanan Firestore (Firestore Security Rules) terkunci. Harap perbarui Aturan Firestore Anda di Firebase Console agar mengizinkan akses tulis (write).';
      }

      res.status(500).json({
        success: false,
        message: friendlyMessage,
        code: error.code
      });
    }
  },

  /**
   * Restore local database from Firestore
   */
  restore: async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    // Restore is highly sensitive: Only Super Admin can restore database
    if (user.role !== 'Super Admin') {
      res.status(403).json({ success: false, message: 'Akses Ditolak: Hanya Super Admin yang dapat memulihkan database dari Cloud.' });
      return;
    }

    try {
      const firestore = getFirestoreInstance();
      const newState: any = { ...db.getState() };

      const collectionsToRestore = [
        'rantings',
        'banoms',
        'users',
        'anggota',
        'anggota_pendidikan',
        'anggota_pekerjaan',
        'potensi',
        'anggota_potensi',
        'pengurus',
        'surat',
        'disposisi',
        'agenda',
        'agenda_attendance',
        'inventaris',
        'inventaris_loan',
        'keuangan',
        'news',
        'gallery',
        'guest_book',
        'audit_logs'
      ];

      console.log('Restoring from Firebase Firestore...');

      for (const colName of collectionsToRestore) {
        const colRef = collection(firestore, colName);
        const snapshot = await getDocs(colRef);
        
        if (!snapshot.empty) {
          const items: any[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data());
          });
          // Sort by ID to keep consistency
          items.sort((a, b) => ((a as any).id || 0) - ((b as any).id || 0));
          newState[colName] = items;
        }
      }

      // Restore settings
      const settingsSnap = await getDocs(collection(firestore, 'settings'));
      if (!settingsSnap.empty) {
        settingsSnap.forEach((docSnap) => {
          newState.settings = docSnap.data();
        });
      }

      // Save to disk atomic transaction
      db.transaction((state: any) => {
        for (const key of Object.keys(newState)) {
          state[key] = newState[key];
        }
        state.last_firebase_backup = new Date().toISOString();
      });

      db.logActivity(
        user.id,
        user.email,
        'FIREBASE_RESTORE',
        'Berhasil memulihkan (restore) seluruh database dari Firebase Firestore'
      );

      res.status(200).json({
        success: true,
        message: 'Database SIM MWC NU berhasil dipulihkan dari Firebase Firestore!',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Restore from Firebase failed:', error);
      
      let friendlyMessage = 'Gagal memulihkan database: ' + error.message;
      if (error.code === 'permission-denied') {
        friendlyMessage = 'Gagal membaca dari Cloud: Aturan Keamanan Firestore (Firestore Security Rules) terkunci. Harap perbarui Aturan Firestore Anda di Firebase Console agar mengizinkan akses baca (read).';
      }

      res.status(500).json({
        success: false,
        message: friendlyMessage,
        code: error.code
      });
    }
  }
};
