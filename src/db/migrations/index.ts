/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import migration1 from './0001_create_rantings';
import migration2 from './0002_create_banoms';
import migration3 from './0003_create_users';
import migration4 from './0004_create_anggota_and_potensi';
import migration5 from './0005_add_rois_syuriah_to_rantings';
import migration6 from './0006_add_photos_and_potentials_to_ranting';
import migration7 from './0007_create_mwc_settings';
import { DatabaseState } from '../schema';

export interface MigrationModule {
  id: string;
  up: (db: DatabaseState) => void;
}

export const migrations: MigrationModule[] = [
  migration1,
  migration2,
  migration3,
  migration4,
  migration5,
  migration6,
  migration7
];

// Helper to run all pending migrations
export function runMigrations(dbState: DatabaseState): boolean {
  if (!dbState.migrations) {
    dbState.migrations = [];
  }

  let ranAny = false;
  for (const m of migrations) {
    if (!dbState.migrations.includes(m.id)) {
      console.log(`Running database migration: ${m.id}...`);
      try {
        m.up(dbState);
        dbState.migrations.push(m.id);
        ranAny = true;
        console.log(`Migration ${m.id} completed successfully.`);
      } catch (error) {
        console.error(`Migration ${m.id} failed to execute:`, error);
        throw error;
      }
    }
  }

  return ranAny;
}
