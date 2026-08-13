# DOKUMEN PERANCANGAN DATABASE (ERD & RELASI TABEL)
## SISTEM INFORMASI MANAJEMEN MWC NU KARANGPAWITAN (SIM MWC NU)

---

### 1. MODEL DIAGRAM ERD (ENTITY RELATIONSHIP DIAGRAM)

Berikut adalah diagram hubungan entitas (ERD) berbasis Mermaid.js yang menggambarkan visualisasi relasi 3NF antar-tabel dalam SIM MWC NU Karangpawitan.

```mermaid
erDiagram
    %% Core Users & Authentication
    USERS {
        serial id PK
        text uid UK "Firebase UID"
        text email NOT-NULL
        text name NOT-NULL
        text role NOT-NULL
        integer ranting_id FK
        integer banom_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% Ranting (Desa)
    RANTING {
        serial id PK
        text code UK NOT-NULL
        text name NOT-NULL
        text address
        text leader_name
        text secretary_name
        text contact_no
        numeric latitude
        numeric longitude
        timestamp created_at
        timestamp updated_at
    }

    %% Badan Otonom & Lembaga
    BANOM {
        serial id PK
        text name NOT-NULL
        text type NOT-NULL "Banom / Lembaga"
        text leader_name
        text contact_no
        timestamp created_at
        timestamp updated_at
    }

    %% Anggota (Core Member / Sensus)
    ANGGOTA {
        serial id PK
        text nik UK NOT-NULL "16 Digits"
        text no_kk NOT-NULL "16 Digits"
        text name NOT-NULL
        text gender NOT-NULL "L / P"
        text place_of_birth
        date date_of_birth
        text marital_status
        boolean is_alive
        text address
        text rt
        text rw
        text phone
        text email
        text photo_url
        integer ranting_id FK
        integer banom_id FK "Optional Primary Banom"
        text jamiyah "Local Jamiyah Name"
        boolean status_active
        integer year_joined
        text kta_number UK
        text status_sensus "Draft / Pending / Approved / Rejected / Revision"
        text notes "Verification Notes"
        text created_by_uid FK
        timestamp created_at
        timestamp updated_at
    }

    %% 1-to-1 Normalization for Pendidikan
    ANGGOTA_PENDIDIKAN {
        serial id PK
        integer anggota_id FK UK
        text last_education "SD-S3 / Pesantren"
        text school_name
        text major
        text pesantren_name
        integer pesantren_duration_years
        text skills
        text certifications
        timestamp created_at
        timestamp updated_at
    }

    %% 1-to-1 Normalization for Pekerjaan & Ekonomi
    ANGGOTA_PEKERJAAN {
        serial id PK
        integer anggota_id FK UK
        text profession
        text company_name
        text position
        boolean has_umkm
        text umkm_name
        text umkm_sector
        text monthly_income "Income Bracket"
        timestamp created_at
        timestamp updated_at
    }

    %% Master Potensi (Many-to-Many)
    POTENSI {
        serial id PK
        text name UK NOT-NULL "Guru, Kyai, Programmer, etc"
        text category "Keagamaan, IT, dsb"
        timestamp created_at
    }

    %% Junction Table for Many-to-Many Potensi
    ANGGOTA_POTENSI {
        integer anggota_id PK, FK
        integer potensi_id PK, FK
    }

    %% Pengurus (MWC & Ranting Struktural)
    PENGURUS {
        serial id PK
        integer anggota_id FK "Optional Link"
        text name NOT-NULL
        text photo_url
        text level NOT-NULL "MWC / Ranting / Banom"
        integer ranting_id FK "Optional"
        integer banom_id FK "Optional"
        text position NOT-NULL "Rois Syuriah, Ketua, etc"
        text sk_number
        text sk_file_url
        integer period_start
        integer period_end
        text status NOT-NULL "Aktif / Demisioner / Wafat"
        timestamp created_at
        timestamp updated_at
    }

    %% Persuratan
    SURAT {
        serial id PK
        text type NOT-NULL "Masuk / Keluar"
        text letter_no NOT-NULL
        date letter_date
        date received_sent_date
        text sender
        text receiver
        text subject NOT-NULL
        text summary
        text file_url "PDF Scan"
        text created_by_uid FK
        timestamp created_at
        timestamp updated_at
    }

    %% Disposisi Surat Masuk
    DISPOSISI {
        serial id PK
        integer surat_id FK
        text assigned_by_uid FK "Usually Ketua MWC"
        integer assigned_to_user_id FK "Optional User"
        integer assigned_to_banom_id FK "Optional Banom"
        text instruction NOT-NULL
        text status NOT-NULL "Belum / Proses / Selesai"
        text notes_completion
        timestamp created_at
        timestamp updated_at
    }

    %% Agenda & Kegiatan
    AGENDA {
        serial id PK
        text title NOT-NULL
        text description
        timestamp start_date
        timestamp end_date
        text location
        boolean is_public
        text notulen
        text documentation_urls "Comma Separated or JSON Array"
        timestamp created_at
        timestamp updated_at
    }

    %% Agenda Attendance
    AGENDA_ATTENDANCE {
        serial id PK
        integer agenda_id FK
        integer anggota_id FK "Optional Link"
        text name NOT-NULL "For Guest/Non-Member"
        text role_or_institution
        text status NOT-NULL "Hadir / Izin / Sakit"
        timestamp signed_at
    }

    %% Inventaris
    INVENTARIS {
        serial id PK
        text code UK NOT-NULL
        text name NOT-NULL
        text category "Elektronik, Alat, dsb"
        text location
        text condition NOT-NULL "Baik / Rusak Ringan / Rusak Berat"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% Inventaris Loan Log
    INVENTARIS_LOAN {
        serial id PK
        integer inventaris_id FK
        text borrower_name NOT-NULL
        text borrower_phone
        text borrower_institution "Ranting / Banom Name"
        date loan_date NOT-NULL
        date estimated_return_date
        date actual_return_date
        text condition_on_loan
        text condition_on_return
        text status NOT-NULL "Dipinjam / Kembali / Terlambat"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% Keuangan / Kas
    KEUANGAN {
        serial id PK
        text type NOT-NULL "Masuk / Keluar"
        text category NOT-NULL "Iuran, Donasi, Bantuan, dsb"
        numeric amount NOT-NULL
        date transaction_date NOT-NULL
        text description NOT-NULL
        text proof_file_url
        text created_by_uid FK
        timestamp created_at
        timestamp updated_at
    }

    %% News (CMS)
    NEWS {
        serial id PK
        text title NOT-NULL
        text slug UK NOT-NULL
        text category NOT-NULL "Kabar Ranting, Opini, Pengumuman"
        text tags
        text content NOT-NULL "HTML Content"
        text thumbnail_url
        text status NOT-NULL "Draft / Published"
        text created_by_uid FK
        timestamp created_at
        timestamp updated_at
    }

    %% Gallery
    GALLERY {
        serial id PK
        text album_name NOT-NULL
        text description
        text media_url NOT-NULL
        text media_type NOT-NULL "Image / Video"
        timestamp created_at
    }

    %% Guest Book
    GUEST_BOOK {
        serial id PK
        text name NOT-NULL
        text phone_or_email
        text institution
        text message NOT-NULL
        boolean is_read
        timestamp created_at
    }

    %% Audit Log for Security
    AUDIT_LOG {
        serial id PK
        integer user_id FK "Optional"
        text user_email
        text action NOT-NULL "VERIFY, CREATE, etc"
        text description NOT-NULL
        text ip_address
        timestamp created_at
    }

    %% Relationships
    USERS }|--|| RANTING : "restricts to"
    USERS }|--|| BANOM : "restricts to"
    ANGGOTA }|--|| RANTING : "belongs to"
    ANGGOTA }|--|| BANOM : "optionally belongs to"
    ANGGOTA ||--|| ANGGOTA_PENDIDIKAN : "has 1-to-1"
    ANGGOTA ||--|| ANGGOTA_PEKERJAAN : "has 1-to-1"
    ANGGOTA_POTENSI }|--|| ANGGOTA : "maps"
    ANGGOTA_POTENSI }|--|| POTENSI : "maps"
    PENGURUS }|--|o ANGGOTA : "references profile"
    PENGURUS }|--|o RANTING : "assigned at"
    PENGURUS }|--|o BANOM : "assigned at"
    DISPOSISI }|--|| SURAT : "disposes"
    DISPOSISI }|--|| USERS : "assigned by/to"
    DISPOSISI }|--|o BANOM : "forwarded to"
    AGENDA_ATTENDANCE }|--|| AGENDA : "attends"
    AGENDA_ATTENDANCE }|--|o ANGGOTA : "logged as"
    INVENTARIS_LOAN }|--|| INVENTARIS : "loans asset"
    KEUANGAN }|--|| USERS : "logged by"
    NEWS }|--|| USERS : "authored by"
```

---

### 2. DETAIL STRUKTUR TABEL & TIPE DATA

#### 2.1 USERS
Tabel ini digunakan untuk sistem otentikasi internal dan otorisasi RBAC (Role-Based Access Control).

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `uid` | varchar(255) | UNIQUE, NOT NULL | UID unik dari Firebase Auth |
| `email` | varchar(255) | NOT NULL | Alamat email terdaftar |
| `name` | varchar(255) | NOT NULL | Nama lengkap user / operator |
| `role` | varchar(50) | NOT NULL | Role: `Super Admin`, `Ketua MWC`, `Sekretaris`, `Bendahara`, `Operator`, `Admin Ranting`, `Admin Banom`, `Viewer` |
| `ranting_id` | integer | FOREIGN KEY, NULL | Relasi ke `ranting.id` (membatasi hak akses wilayah desa bagi Admin Ranting) |
| `banom_id` | integer | FOREIGN KEY, NULL | Relasi ke `banom.id` (membatasi hak akses banom bagi Admin Banom) |
| `created_at` | timestamp | DEFAULT NOW() | Tanggal pendaftaran |
| `updated_at` | timestamp | DEFAULT NOW() | Tanggal pembaruan |

#### 2.2 RANTING
Mewakili struktur organisasi NU tingkat Kelurahan/Desa di wilayah Kecamatan Karangpawitan.

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `code` | varchar(50) | UNIQUE, NOT NULL | Kode ranting (cth: `RNT-KRP-001`) |
| `name` | varchar(100) | NOT NULL | Nama ranting (Nama Desa/Kelurahan) |
| `address` | text | NULL | Alamat sekretariat ranting |
| `leader_name` | varchar(255) | NULL | Nama Ketua Tanfidziyah Ranting |
| `secretary_name` | varchar(255) | NULL | Nama Sekretaris Ranting |
| `contact_no` | varchar(20) | NULL | Kontak/WA resmi ranting |
| `latitude` | double precision | NULL | Koordinat geografis lintang kantor |
| `longitude` | double precision | NULL | Koordinat geografis bujur kantor |
| `created_at` | timestamp | DEFAULT NOW() | Catatan dibuat |
| `updated_at` | timestamp | DEFAULT NOW() | Catatan diperbarui |

#### 2.3 BANOM
Badan Otonom (Banom) dan Lembaga otonom di bawah MWC NU Karangpawitan.

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `name` | varchar(100) | NOT NULL | Nama Banom/Lembaga (cth: `GP Ansor`, `Muslimat`, `LazisNU`) |
| `type` | varchar(50) | NOT NULL | Klasifikasi: `Banom` atau `Lembaga` |
| `leader_name` | varchar(255) | NULL | Nama Ketua |
| `contact_no` | varchar(20) | NULL | Kontak penghubung WA |
| `created_at` | timestamp | DEFAULT NOW() | Catatan dibuat |
| `updated_at` | timestamp | DEFAULT NOW() | Catatan diperbarui |

#### 2.4 ANGGOTA
Data induk warga NU (Sensus KTA NU). Menampung profil dasar lengkap.

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `nik` | varchar(16) | UNIQUE, NOT NULL | Nomor Induk Kependudukan |
| `no_kk` | varchar(16) | NOT NULL | Nomor Kartu Keluarga |
| `name` | varchar(255) | NOT NULL | Nama lengkap sesuai KTP |
| `gender` | char(1) | NOT NULL | Jenis Kelamin: `L` (Laki-laki) atau `P` (Perempuan) |
| `place_of_birth` | varchar(100) | NULL | Tempat Lahir |
| `date_of_birth` | date | NULL | Tanggal Lahir |
| `marital_status` | varchar(50) | NULL | Status: `Belum Kawin`, `Kawin`, `Cerai Hidup`, `Cerai Mati` |
| `is_alive` | boolean | DEFAULT TRUE | Status Hidup |
| `address` | text | NULL | Alamat jalan / RT-RW |
| `rt` | varchar(10) | NULL | Nomor RT |
| `rw` | varchar(10) | NULL | Nomor RW |
| `phone` | varchar(20) | NULL | Nomor WhatsApp aktif |
| `email` | varchar(255) | NULL | Alamat email |
| `photo_url` | text | NULL | File foto KTA/Sensus |
| `ranting_id` | integer | FOREIGN KEY, NOT NULL | Relasi ke `ranting.id` |
| `banom_id` | integer | FOREIGN KEY, NULL | Afiliasi Banom Utama jika ada |
| `jamiyah` | varchar(255) | NULL | Majelis Taklim/Jamiyah tempat aktif |
| `status_active` | boolean | DEFAULT TRUE | Status Keaktifan dalam kegiatan |
| `year_joined` | integer | NULL | Tahun bergabung dengan NU |
| `kta_number` | varchar(100) | UNIQUE, NULL | Nomor KTA resmi (jika ada) |
| `status_sensus` | varchar(50) | DEFAULT 'Draft' | Alur Verifikasi: `Draft`, `Menunggu Verifikasi`, `Revisi`, `Disetujui`, `Ditolak` |
| `notes` | text | NULL | Catatan revisi/penolakan dari verifikator |
| `created_by_uid` | varchar(255) | FOREIGN KEY, NOT NULL | Referensi UID penginput (Relasi ke `users.uid`) |
| `created_at` | timestamp | DEFAULT NOW() | Tanggal entri data |
| `updated_at` | timestamp | DEFAULT NOW() | Tanggal pembaruan data |

#### 2.5 ANGGOTA_PENDIDIKAN (1-to-1 Anggota)
Normalisasi 3NF untuk memisahkan data pendidikan, pesantren, dan keterampilan anggota.

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `anggota_id` | integer | FOREIGN KEY, UNIQUE, NOT NULL | Relasi ke `anggota.id` (Cascade Delete) |
| `last_education` | varchar(50) | NULL | Pendidikan formal terakhir (SD, SMP, SMA, S1, dsb) |
| `school_name` | varchar(255) | NULL | Nama instansi sekolah/universitas |
| `major` | varchar(255) | NULL | Jurusan / Program Studi |
| `pesantren_name` | varchar(255) | NULL | Nama Pondok Pesantren tempat menimba ilmu |
| `pesantren_duration_years` | integer | NULL | Lama nyantri (dalam tahun) |
| `skills` | text | NULL | Deskripsi keahlian teknis/non-teknis |
| `certifications` | text | NULL | Sertifikasi profesi/kompetensi yang dimiliki |
| `created_at` | timestamp | DEFAULT NOW() | Catatan dibuat |
| `updated_at` | timestamp | DEFAULT NOW() | Catatan diperbarui |

#### 2.6 ANGGOTA_PEKERJAAN (1-to-1 Anggota)
Normalisasi 3NF untuk memisahkan data profesi, ekonomi, dan UMKM warga.

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `anggota_id` | integer | FOREIGN KEY, UNIQUE, NOT NULL | Relasi ke `anggota.id` (Cascade Delete) |
| `profession` | varchar(100) | NULL | Profesi utama (cth: `Guru`, `PNS`, `Tani`, `Wiraswasta`) |
| `company_name` | varchar(255) | NULL | Nama tempat kerja / instansi |
| `position` | varchar(255) | NULL | Jabatan di tempat kerja |
| `has_umkm` | boolean | DEFAULT FALSE | Apakah memiliki usaha UMKM |
| `umkm_name` | varchar(255) | NULL | Nama unit usaha UMKM |
| `umkm_sector` | varchar(100) | NULL | Sektor bidang UMKM (cth: `Kuliner`, `Jasa`, `Tani`) |
| `monthly_income` | varchar(50) | NULL | Rentang pendapatan (Iuran/ekonomi category) |
| `created_at` | timestamp | DEFAULT NOW() | Catatan dibuat |
| `updated_at` | timestamp | DEFAULT NOW() | Catatan diperbarui |

#### 2.7 POTENSI (Master Potensi SDM)
Daftar keahlian/peran strategis organisasi (Keagamaan, Sosial, Medis, dsb).

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `name` | varchar(100) | UNIQUE, NOT NULL | Cth: `Kyai`, `Ustadz`, `Hafidz`, `Programmer`, `Dokter` |
| `category` | varchar(100) | NULL | Klasifikasi: `Keagamaan`, `Teknologi`, `Kesehatan`, `Seni`, dsb |
| `created_at` | timestamp | DEFAULT NOW() | Tanggal dibuat |

#### 2.8 ANGGOTA_POTENSI (Many-to-Many Junction)
Menghubungkan satu anggota dengan banyak potensi SDM secara silang (Many-to-Many).

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `anggota_id` | integer | PRIMARY KEY, FOREIGN KEY | Relasi ke `anggota.id` (Cascade Delete) |
| `potensi_id` | integer | PRIMARY KEY, FOREIGN KEY | Relasi ke `potensi.id` (Cascade Delete) |

#### 2.9 PENGURUS
Struktur fungsional kepengurusan MWC NU Karangpawitan beserta ranting.

| Nama Kolom | Tipe Data | Atribut | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | serial | PRIMARY KEY | ID Auto-increment |
| `anggota_id` | integer | FOREIGN KEY, NULL | Hubungan ke data induk anggota (opsional jika terdata) |
| `name` | varchar(255) | NOT NULL | Nama pengurus (fallback jika belum terdata di sensus) |
| `photo_url` | text | NULL | Foto kepengurusan |
| `level` | varchar(50) | NOT NULL | Tingkat: `MWC`, `Ranting`, `Banom` |
| `ranting_id` | integer | FOREIGN KEY, NULL | Relasi ke `ranting.id` (diisi jika kepengurusan tingkat ranting) |
| `banom_id` | integer | FOREIGN KEY, NULL | Relasi ke `banom.id` (diisi jika kepengurusan banom) |
| `position` | varchar(100) | NOT NULL | Jabatan struktural (cth: `Rois Syuriah`, `Ketua Tanfidziyah`, dsb) |
| `sk_number` | varchar(100) | NULL | Nomor SK Resmi |
| `sk_file_url` | text | NULL | File PDF/Scan SK Kepengurusan |
| `period_start` | integer | NOT NULL | Tahun mulai khidmat (cth: `2024`) |
| `period_end` | integer | NOT NULL | Tahun akhir khidmat (cth: `2029`) |
| `status` | varchar(50) | NOT NULL | Status: `Aktif`, `Demisioner`, `Mutasi`, `Wafat` |
| `created_at` | timestamp | DEFAULT NOW() | Catatan dibuat |
| `updated_at` | timestamp | DEFAULT NOW() | Catatan diperbarui |

---

### 3. RELASI & ATURAN DATABASE TRANSACTION

Demi menjamin konsistensi data organisasi pada tingkat enterprise, sistem menerapkan beberapa integritas database:

1. **Cascade Delete pada Profile**: Saat baris di tabel `ANGGOTA` dihapus (Soft Delete/Hard Delete), relasi pada `ANGGOTA_PENDIDIKAN` dan `ANGGOTA_PEKERJAAN` serta relasi pada tabel persilangan `ANGGOTA_POTENSI` wajib terhapus secara otomatis (`ON DELETE CASCADE`).
2. **Database Transaction (Atomicity)**: Penambahan anggota sensus baru menyangkut entri ke tiga tabel berbeda (`ANGGOTA`, `ANGGOTA_PENDIDIKAN`, dan `ANGGOTA_PEKERJAAN`). Ini harus dijalankan di dalam satu blok transaksi database tunggal (*Single Transaction Block*) di API backend untuk mencegah data yatim piatu (*orphan record*) jika terjadi gangguan server saat eksekusi berlangsung.
3. **Validasi NIK Unik**: NIK bersifat mutlak dan tidak boleh duplikat. Sistem akan menolak masukan sensus baru jika NIK sudah ada di dalam database, untuk menghindari manipulasi jumlah warga.

---

*Dokumen ERD ini siap diimplementasikan ke dalam skema migrasi database PostgreSQL (menggunakan Drizzle ORM).*
