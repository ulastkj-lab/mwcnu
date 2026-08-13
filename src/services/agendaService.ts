/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Agenda {
  id: number;
  title: string;
  category: string; // 'Rapat Pleno', 'Pengajian', 'Sosial', 'Konferensi', 'Pelatihan'
  date: string; // YYYY-MM-DD
  time_start: string; // HH:MM
  time_end: string; // HH:MM
  location: string;
  notes: string;
  target_audience: string; // e.g., 'Semua Pengurus', 'Suryah & Tanfidziyah', 'Kader Ansor', 'Warga Umum'
  organizer: string; // e.g., 'MWC NU', 'Rijalul Ansor', 'Muslimat', 'IPNU/IPPNU'
  pj_name: string; // Penanggung Jawab
  status: 'Mendatang' | 'Sedang Berlangsung' | 'Selesai' | 'Dibatalkan';
  is_public: boolean;
}

const STORAGE_KEY = 'mwc_agenda_items';

export const DEFAULT_AGENDAS: Agenda[] = [
  {
    id: 1,
    title: 'Konferensi Ranting NU Se-Kecamatan Karangpawitan',
    category: 'Konferensi',
    date: '2026-07-04',
    time_start: '08:00',
    time_end: '12:00',
    location: 'Aula Sekretariat MWC NU Karangpawitan',
    notes: 'Konsolidasi organisasi tingkat ranting se-Kecamatan Karangpawitan guna sinkronisasi data sensus mandiri serta pemilihan pengurus baru masa khidmat berikutnya.',
    target_audience: 'Semua Pengurus Ranting & MWC',
    organizer: 'Tanfidziyah MWC NU',
    pj_name: 'Kiai Ahmad (Ketua MWC)',
    status: 'Mendatang',
    is_public: true
  },
  {
    id: 2,
    title: 'Lailatul Ijtima & Pengajian Bulanan Rijalul Ansor',
    category: 'Pengajian',
    date: '2026-07-07',
    time_start: '19:30',
    time_end: '22:30',
    location: 'Masjid Jami At-Taqwa Ranting Godog',
    notes: 'Kajian kitab kuning, istighotsah kubro, dan penguatan ideologi Aswaja An-Nahdliyah bagi kader muda GP Ansor di Ranting Godog.',
    target_audience: 'Warga Nahdliyin & Pemuda GP Ansor',
    organizer: 'GP Ansor Karangpawitan',
    pj_name: 'Sahabat Ridwan (Ketua PAC GP Ansor)',
    status: 'Mendatang',
    is_public: true
  },
  {
    id: 3,
    title: 'Rapat Pleno Syuriah & Tanfidziyah Triwulan',
    category: 'Rapat Pleno',
    date: '2026-07-15',
    time_start: '13:00',
    time_end: '16:00',
    location: 'Sekretariat Utama MWC NU Karangpawitan',
    notes: 'Evaluasi berkala progres sensus digital 3NF, audit kas keuangan organisasi, serta persiapan peresmian gedung dakwah MWC NU.',
    target_audience: 'Pengurus Harian Syuriah & Tanfidziyah',
    organizer: 'Sekretariat MWC NU',
    pj_name: 'Ustadz Hasan (Sekretaris MWC)',
    status: 'Mendatang',
    is_public: false
  }
];

export const agendaService = {
  /**
   * Get all agendas from local storage, with fallback to defaults.
   */
  getAgendas(): Agenda[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved agendas, using defaults', e);
        return DEFAULT_AGENDAS;
      }
    }
    // Initialize with default on first run
    this.saveAgendasToStorage(DEFAULT_AGENDAS);
    return DEFAULT_AGENDAS;
  },

  /**
   * Write agenda list to local storage and dispatch update event.
   */
  saveAgendasToStorage(agendas: Agenda[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agendas));
    // Trigger custom storage event for sync
    window.dispatchEvent(new Event('storage'));
  },

  /**
   * Validate agenda data before insertion or update.
   * Returns validation error map.
   */
  validate(data: Partial<Omit<Agenda, 'id'>>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Title Validation
    if (!data.title || !data.title.trim()) {
      errors.title = 'Nama atau judul kegiatan wajib diisi.';
    } else if (data.title.trim().length < 5) {
      errors.title = 'Nama kegiatan terlalu pendek (minimal 5 karakter).';
    } else if (data.title.trim().length > 150) {
      errors.title = 'Nama kegiatan terlalu panjang (maksimal 150 karakter).';
    }

    // Category Validation
    const validCategories = ['Rapat Pleno', 'Pengajian', 'Sosial', 'Konferensi', 'Pelatihan'];
    if (!data.category || !validCategories.includes(data.category)) {
      errors.category = 'Kategori kegiatan tidak valid atau wajib dipilih.';
    }

    // Date Validation
    if (!data.date) {
      errors.date = 'Tanggal pelaksanaan wajib ditentukan.';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        errors.date = 'Format tanggal tidak valid. Harus YYYY-MM-DD.';
      }
    }

    // Time Start Validation
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!data.time_start) {
      errors.time_start = 'Waktu mulai wajib ditentukan.';
    } else if (!timeRegex.test(data.time_start)) {
      errors.time_start = 'Format waktu mulai tidak valid. Gunakan format HH:MM.';
    }

    // Time End Validation
    if (data.time_end && !timeRegex.test(data.time_end)) {
      errors.time_end = 'Format waktu selesai tidak valid. Gunakan format HH:MM.';
    } else if (data.time_start && data.time_end) {
      const startMinutes = this.timeToMinutes(data.time_start);
      const endMinutes = this.timeToMinutes(data.time_end);
      if (endMinutes <= startMinutes) {
        errors.time_end = 'Waktu selesai harus setelah waktu mulai.';
      }
    }

    // Location Validation
    if (!data.location || !data.location.trim()) {
      errors.location = 'Lokasi atau tempat acara wajib ditentukan.';
    } else if (data.location.trim().length < 4) {
      errors.location = 'Detail lokasi terlalu pendek (minimal 4 karakter).';
    } else if (data.location.trim().length > 250) {
      errors.location = 'Detail lokasi terlalu panjang (maksimal 250 karakter).';
    }

    // Penyelenggara (Organizer)
    if (!data.organizer || !data.organizer.trim()) {
      errors.organizer = 'Penyelenggara / panitia wajib diisi.';
    }

    // Penanggung Jawab (PJ)
    if (!data.pj_name || !data.pj_name.trim()) {
      errors.pj_name = 'Nama penanggung jawab wajib diisi.';
    } else if (data.pj_name.trim().length < 3) {
      errors.pj_name = 'Nama penanggung jawab minimal 3 karakter.';
    }

    // Status Validation
    const validStatuses = ['Mendatang', 'Sedang Berlangsung', 'Selesai', 'Dibatalkan'];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.status = 'Status kegiatan wajib ditentukan.';
    }

    return errors;
  },

  /**
   * Helper to convert HH:MM string to total minutes in the day.
   */
  timeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  },

  /**
   * Create a new Agenda record.
   */
  createAgenda(newAgendaData: Omit<Agenda, 'id'>): { success: boolean; data?: Agenda; errors?: Record<string, string> } {
    const errors = this.validate(newAgendaData);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const agendas = this.getAgendas();
    const newAgenda: Agenda = {
      ...newAgendaData,
      id: agendas.length > 0 ? Math.max(...agendas.map(a => a.id)) + 1 : 1
    };

    const updated = [newAgenda, ...agendas];
    this.saveAgendasToStorage(updated);

    return { success: true, data: newAgenda };
  },

  /**
   * Update an existing Agenda record by ID.
   */
  updateAgenda(id: number, updatedAgendaData: Omit<Agenda, 'id'>): { success: boolean; data?: Agenda; errors?: Record<string, string> } {
    const errors = this.validate(updatedAgendaData);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const agendas = this.getAgendas();
    const agendaIndex = agendas.findIndex(a => a.id === id);
    if (agendaIndex === -1) {
      return { 
        success: false, 
        errors: { general: 'Agenda tidak ditemukan atau telah dihapus.' } 
      };
    }

    const updatedAgenda: Agenda = {
      ...updatedAgendaData,
      id
    };

    const updated = [...agendas];
    updated[agendaIndex] = updatedAgenda;
    this.saveAgendasToStorage(updated);

    return { success: true, data: updatedAgenda };
  },

  /**
   * Delete an Agenda record by ID.
   */
  deleteAgenda(id: number): { success: boolean; error?: string } {
    const agendas = this.getAgendas();
    const filtered = agendas.filter(a => a.id !== id);
    
    if (filtered.length === agendas.length) {
      return { success: false, error: 'Agenda tidak ditemukan.' };
    }

    this.saveAgendasToStorage(filtered);
    return { success: true };
  }
};
