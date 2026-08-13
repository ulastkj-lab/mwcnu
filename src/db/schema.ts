/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core Schema Definitions for SIM MWC NU Karangpawitan Database

export interface Ranting {
  id: number;
  code: string; // Unique
  name: string;
  address: string | null;
  rois_name?: string | null;
  leader_name: string | null;
  secretary_name: string | null;
  contact_no: string | null;
  latitude: number | null;
  longitude: number | null;
  rois_photo_url?: string | null;
  leader_photo_url?: string | null;
  secretary_photo_url?: string | null;
  potensi_ekonomi?: string[] | null;
  potensi_unggulan?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Banom {
  id: number;
  name: string;
  type: 'Banom' | 'Lembaga';
  code?: string | null;
  leader_name: string | null;
  secretary_name?: string | null;
  treasurer_name?: string | null;
  contact_no: string | null;
  address?: string | null;
  description?: string | null;
  sk_number?: string | null;
  sk_file_url?: string | null;
  sk_date?: string | null;
  period_start?: number | null;
  period_end?: number | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  uid: string; // Firebase / Custom Auth UID - Unique
  email: string; // Unique
  name: string;
  role: 'Super Admin' | 'Ketua MWC' | 'Sekretaris' | 'Bendahara' | 'Operator' | 'Admin Ranting' | 'Admin Banom' | 'Viewer';
  ranting_id: number | null; // Nullable, restricts Admin Ranting
  banom_id: number | null; // Nullable, restricts Admin Banom
  password?: string | null; // Hashed or plain password string for authentication
  created_at: string;
  updated_at: string;
}

export interface Anggota {
  id: number;
  nik: string; // 16 Digits, Unique
  no_kk: string; // 16 Digits
  name: string;
  gender: 'L' | 'P';
  place_of_birth: string | null;
  date_of_birth: string | null; // YYYY-MM-DD
  marital_status: 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati' | null;
  is_alive: boolean;
  address: string | null;
  rt: string | null;
  rw: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  ranting_id: number; // Foreign Key to Ranting
  banom_id: number | null; // Optional Primary Banom FK
  jamiyah: string | null;
  status_active: boolean;
  year_joined: number | null;
  kta_number: string | null; // Unique, system generated
  status_sensus: 'Draft' | 'Menunggu Verifikasi' | 'Revisi' | 'Disetujui' | 'Ditolak';
  notes: string | null; // Verificator notes for rejection/revision
  mwc_posisi?: string | null; // e.g. 'Lembaga' | 'Banom' | 'Ranting' | null
  mwc_posisi_nama?: string | null; // e.g. 'LDNU', 'Ansor', 'Ranting Lebakjaya'
  mwc_jabatan?: string | null; // e.g. 'Ketua', 'Sekretaris', 'Anggota'
  created_by_uid: string; // FK to User.uid
  created_at: string;
  updated_at: string;
}

export interface AnggotaPendidikan {
  id: number;
  anggota_id: number; // Unique FK (1-to-1)
  last_education: 'SD' | 'SMP' | 'SMA' | 'D1' | 'D2' | 'D3' | 'S1' | 'S2' | 'S3' | 'Pesantren' | 'Lainnya' | null;
  school_name: string | null;
  major: string | null;
  pesantren_name: string | null;
  pesantren_duration_years: number | null;
  skills: string | null;
  certifications: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnggotaPekerjaan {
  id: number;
  anggota_id: number; // Unique FK (1-to-1)
  profession: string | null;
  company_name: string | null;
  position: string | null;
  has_umkm: boolean;
  umkm_name: string | null;
  umkm_sector: string | null;
  monthly_income: string | null; // Rentang Pendapatan
  created_at: string;
  updated_at: string;
}

export interface Potensi {
  id: number;
  name: string; // Unique, e.g., 'Kyai', 'Ustadz', 'Programmer'
  category: string | null;
  created_at: string;
}

export interface AnggotaPotensi {
  anggota_id: number;
  potensi_id: number;
}

export interface Pengurus {
  id: number;
  anggota_id: number | null; // Link ke Sensus Anggota (optional)
  name: string; // Fallback jika anggota_id null
  photo_url: string | null;
  level: 'MWC' | 'Ranting' | 'Banom';
  ranting_id: number | null; // FK jika level Ranting
  banom_id: number | null; // FK jika level Banom
  position: string;
  sk_number: string | null;
  sk_file_url: string | null;
  period_start: number;
  period_end: number;
  status: 'Aktif' | 'Demisioner' | 'Wafat';
  created_at: string;
  updated_at: string;
}

export interface Surat {
  id: number;
  type: 'Masuk' | 'Keluar';
  letter_no: string;
  letter_date: string | null;
  received_sent_date: string | null;
  sender: string | null;
  receiver: string | null;
  subject: string;
  summary: string | null;
  file_url: string | null; // Scan PDF
  created_by_uid: string; // FK to User.uid
  created_at: string;
  updated_at: string;
}

export interface Disposisi {
  id: number;
  surat_id: number; // FK to Surat
  assigned_by_uid: string; // User.uid (usually Ketua MWC)
  assigned_to_user_id: number | null; // FK to User.id (optional)
  assigned_to_banom_id: number | null; // FK to Banom.id (optional)
  instruction: string;
  status: 'Belum' | 'Proses' | 'Selesai';
  notes_completion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agenda {
  id: number;
  title: string;
  description: string | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  location: string | null;
  is_public: boolean;
  notulen: string | null;
  documentation_urls: string[] | null; // Saved as JSON string in actual db
  created_at: string;
  updated_at: string;
}

export interface AgendaAttendance {
  id: number;
  agenda_id: number;
  anggota_id: number | null;
  name: string; // Fallback for guest
  role_or_institution: string | null;
  status: 'Hadir' | 'Izin' | 'Sakit';
  signed_at: string;
}

export interface Inventaris {
  id: number;
  code: string; // Unique
  name: string;
  category: string | null;
  location: string | null;
  condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  quantity?: number; // Jumlah unit / pcs
  photo_url?: string | null; // URL atau Base64 foto barang
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventarisLoan {
  id: number;
  inventaris_id: number;
  borrower_name: string;
  borrower_phone: string | null;
  borrower_institution: string | null;
  loan_date: string;
  estimated_return_date: string | null;
  actual_return_date: string | null;
  condition_on_loan: string | null;
  condition_on_return: string | null;
  status: 'Dipinjam' | 'Kembali' | 'Terlambat';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Keuangan {
  id: number;
  type: 'Masuk' | 'Keluar';
  category: string;
  amount: number;
  transaction_date: string;
  description: string;
  proof_file_url: string | null;
  created_by_uid: string; // FK to User.uid
  created_at: string;
  updated_at: string;
}

export interface News {
  id: number;
  title: string;
  slug: string; // Unique
  category: string; // e.g., 'Kabar Ranting', 'Opini', 'Pengumuman'
  tags: string | null;
  content: string; // HTML TinyMCE Content
  thumbnail_url: string | null;
  status: 'Draft' | 'Published';
  created_by_uid: string; // FK to User.uid
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: number;
  album_name: string;
  description: string | null;
  media_url: string;
  media_type: 'Image' | 'Video';
  created_at: string;
}

export interface GuestBook {
  id: number;
  name: string;
  phone_or_email: string | null;
  institution: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export interface WaBlastLog {
  phone: string;
  name: string;
  status: 'Success' | 'Failed';
  error?: string;
  sent_at: string;
}

export interface WaBlast {
  id: number;
  title: string;
  message_template: string;
  recipient_type: 'Anggota' | 'Ranting' | 'Banom' | 'Semua';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'Draft' | 'Sending' | 'Completed' | 'Failed';
  logs: WaBlastLog[];
  created_at: string;
}

// Database schema container
export interface DatabaseState {
  rantings: Ranting[];
  banoms: Banom[];
  users: User[];
  anggota: Anggota[];
  anggota_pendidikan: AnggotaPendidikan[];
  anggota_pekerjaan: AnggotaPekerjaan[];
  potensi: Potensi[];
  anggota_potensi: AnggotaPotensi[];
  pengurus: Pengurus[];
  surat: Surat[];
  disposisi: Disposisi[];
  agenda: Agenda[];
  agenda_attendance: AgendaAttendance[];
  inventaris: Inventaris[];
  inventaris_loan: InventarisLoan[];
  keuangan: Keuangan[];
  news: News[];
  gallery: Gallery[];
  guest_book: GuestBook[];
  audit_logs: AuditLog[];
  wa_blasts: WaBlast[];
  migrations: string[]; // List of ran migration files
  settings?: MwcSettings;
}

export interface MwcStructure {
  mustasyar: string[];
  syuriah: {
    rais: string;
    wakil_rais: string[];
    katib: string;
    wakil_katib: string[];
    a_wan: string[];
  };
  tanfidziyah: {
    ketua: string;
    wakil_ketua: string[];
    sekretaris: string;
    wakil_sekretaris: string[];
    bendahara: string;
    wakil_bendahara: string[];
  };
}

export interface SocialMediaLinks {
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  whatsapp?: string | null;
  website?: string | null;
}

export interface LeadershipPhotos {
  rois_photo_url?: string | null;
  katib_photo_url?: string | null;
  ketua_photo_url?: string | null;
  sekretaris_photo_url?: string | null;
}

export interface MwcSettings {
  name: string;
  logo_url: string | null;
  structure: MwcStructure;
  social_media?: SocialMediaLinks;
  leadership_photos?: LeadershipPhotos;
}

