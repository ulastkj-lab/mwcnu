/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseState, Ranting, Banom, User, Anggota, AnggotaPendidikan, AnggotaPekerjaan, Potensi, AnggotaPotensi, Pengurus, Surat, Disposisi, Agenda, AgendaAttendance, Inventaris, InventarisLoan, Keuangan, News, Gallery, GuestBook, AuditLog } from './schema';
import { runMigrations } from './migrations/index';

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'db', 'data.json');

// Default initial database state matching 3NF layout
const INITIAL_STATE: DatabaseState = {
  rantings: [],
  banoms: [],
  users: [],
  anggota: [],
  anggota_pendidikan: [],
  anggota_pekerjaan: [],
  potensi: [],
  anggota_potensi: [],
  pengurus: [],
  surat: [],
  disposisi: [],
  agenda: [],
  agenda_attendance: [],
  inventaris: [],
  inventaris_loan: [],
  keuangan: [],
  news: [],
  gallery: [],
  guest_book: [],
  audit_logs: [],
  wa_blasts: [],
  migrations: []
};

export class DatabaseEngine {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
    try {
      const ran = runMigrations(this.state);
      if (ran) {
        this.save();
        console.log('Database state successfully migrated and written to disk.');
      }
    } catch (error) {
      console.error('Critical database migration failed on startup:', error);
    }
  }

  // Load state from file
  private load(): DatabaseState {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE_PATH)) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_STATE, null, 2), 'utf-8');
        return JSON.parse(JSON.stringify(INITIAL_STATE));
      }

      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Ensure all tables are initialized in case of upgrades
      return {
        ...INITIAL_STATE,
        ...parsed
      };
    } catch (error) {
      console.error('Failed to load database. Falling back to in-memory state.', error);
      return JSON.parse(JSON.stringify(INITIAL_STATE));
    }
  }

  // Persist state to file safely using synchronous write
  private save(): void {
    try {
      const tempPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (error) {
      console.error('Failed to write database to disk:', error);
      throw new Error('Database I/O Error: Gagal menyimpan data ke disk.');
    }
  }

  // Retrieve full state for transactions/view
  public getState(): DatabaseState {
    return this.state;
  }

  // Atomic database transaction execution
  public transaction<T>(callback: (db: DatabaseState) => T): T {
    // Deep clone state to support rollbacks on failure
    const backup = JSON.parse(JSON.stringify(this.state));
    try {
      const result = callback(this.state);
      this.save(); // Save after successful execution of callback
      return result;
    } catch (error) {
      this.state = backup; // Rollback
      console.log('Transaction rolled back:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // Audit logger helper
  public logActivity(userId: number | null, email: string | null, action: string, description: string, ip: string | null = '127.0.0.1'): void {
    this.transaction((db) => {
      const logId = db.audit_logs.length > 0 ? Math.max(...db.audit_logs.map(l => l.id)) + 1 : 1;
      const log: AuditLog = {
        id: logId,
        user_id: userId,
        user_email: email,
        action,
        description,
        ip_address: ip,
        created_at: new Date().toISOString()
      };
      db.audit_logs.push(log);
    });
  }
}

// Single instance of database engine
export const db = new DatabaseEngine();
