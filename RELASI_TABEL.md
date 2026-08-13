# DOKUMEN SPESIFIKASI RELASI ANTAR TABEL & ATURAN INTEGRITAS
## SISTEM INFORMASI MANAJEMEN MWC NU KARANGPAWITAN (SIM MWC NU)

---

### 1. PEMETAAN HUBUNGAN (RELATIONSHIP MAPPING)

Sistem database dirancang menggunakan standarisasi **3rd Normal Form (3NF)** guna menghindari duplikasi data, anomali mutasi (insert, update, delete), serta menjamin performa query yang optimal pada tingkat skala enterprise. Berikut adalah rincian hubungan antar-entitas dalam sistem:

#### 1.1 Hubungan Satu-ke-Banyak (One-to-Many / 1:N)

##### A. Ranting ───< Anggota
*   **Logika Bisnis**: Kecamatan Karangpawitan memiliki beberapa Desa/Kelurahan (diwakili oleh entitas Ranting). Setiap warga NU (Anggota) wajib berdomisili di salah satu Ranting tertentu. Satu Ranting menampung banyak Anggota.
*   **Kunci Relasi**: `anggota.ranting_id` adalah *Foreign Key* (FK) yang mereferensikan `ranting.id`.
*   **Aturan Integritas**: `ON DELETE RESTRICT` (Ranting tidak dapat dihapus jika masih memiliki Anggota terdaftar untuk mencegah data yatim piatu).

##### B. Banom ───< Anggota (Afiliasi Utama)
*   **Logika Bisnis**: Anggota NU dapat memiliki afiliasi primer ke salah satu Badan Otonom (misal: pemuda usia di bawah 40 tahun terafiliasi ke GP Ansor, pelajar ke IPNU/IPPNU, ibu-ibu ke Muslimat). Ini sifatnya opsional (*nullable*).
*   **Kunci Relasi**: `anggota.banom_id` (FK) mereferensikan `banom.id`.
*   **Aturan Integritas**: `ON DELETE SET NULL` (jika data struktur Banom dihapus, status keanggotaan warga tetap ada tetapi kolom afiliasi Banom di-set kosong).

##### C. Ranting ───< Users (Akses Operator Ranting)
*   **Logika Bisnis**: Setiap User dengan peran `Admin Ranting` dibatasi hak aksesnya hanya untuk mengelola data sensus di desa tempat tugasnya. Satu ranting dapat memiliki lebih dari satu operator.
*   **Kunci Relasi**: `users.ranting_id` (FK) mereferensikan `ranting.id`.
*   **Aturan Integritas**: `ON DELETE RESTRICT`.

##### D. Banom ───< Users (Akses Operator Banom)
*   **Logika Bisnis**: User dengan peran `Admin Banom` hanya dapat mengelola data organisasi internal Banom-nya sendiri.
*   **Kunci Relasi**: `users.banom_id` (FK) mereferensikan `banom.id`.
*   **Aturan Integritas**: `ON DELETE RESTRICT`.

##### E. Surat ───< Disposisi
*   **Logika Bisnis**: Satu Surat Masuk dapat memiliki beberapa tahapan instruksi disposisi dari Ketua MWC ke pengurus harian atau lembaga otonom.
*   **Kunci Relasi**: `disposisi.surat_id` (FK) mereferensikan `surat.id`.
*   **Aturan Integritas**: `ON DELETE CASCADE` (jika arsip surat dihapus, log disposisinya otomatis terhapus).

##### F. Agenda ───< Agenda_Attendance (Daftar Hadir)
*   **Logika Bisnis**: Satu agenda kegiatan memiliki banyak record absensi kehadiran peserta.
*   **Kunci Relasi**: `agenda_attendance.agenda_id` (FK) mereferensikan `agenda.id`.
*   **Aturan Integritas**: `ON DELETE CASCADE`.

##### G. Inventaris ───< Inventaris_Loan (Log Peminjaman)
*   **Logika Bisnis**: Satu barang inventaris organisasi dapat dipinjam berulang kali secara bergantian oleh berbagai ranting/banom, mencatatkan log riwayat peminjaman yang panjang.
*   **Kunci Relasi**: `inventaris_loan.inventaris_id` (FK) mereferensikan `inventaris.id`.
*   **Aturan Integritas**: `ON DELETE RESTRICT` (Aset barang tidak boleh dihapus dari sistem jika memiliki transaksi peminjaman aktif yang belum dikembalikan).

---

#### 1.2 Hubungan Satu-ke-Satu (One-to-One / 1:1)

Untuk mencegah membengkaknya tabel `ANGGOTA` (menghindari kolom kosong berlebih jika warga belum memiliki data detail tertentu), tabel riwayat pendidikan dan profesi dipisah ke tabel khusus:

##### A. Anggota ─── Anggota_Pendidikan
*   **Logika Bisnis**: Setiap Anggota memiliki tepat satu profil pendidikan formal dan non-formal (pesantren/keahlian).
*   **Kunci Relasi**: `anggota_pendidikan.anggota_id` (FK, UNIQUE) mereferensikan `anggota.id`.
*   **Aturan Integritas**: `ON DELETE CASCADE` (jika data Anggota dihapus, profil pendidikannya otomatis ikut terhapus).

##### B. Anggota ─── Anggota_Pekerjaan
*   **Logika Bisnis**: Setiap Anggota memiliki tepat satu profil pekerjaan dan kepemilikan unit usaha UMKM ekonomi produktif.
*   **Kunci Relasi**: `anggota_pekerjaan.anggota_id` (FK, UNIQUE) mereferensikan `anggota.id`.
*   **Aturan Integritas**: `ON DELETE CASCADE` (jika data Anggota dihapus, profil ekonominya otomatis ikut terhapus).

---

#### 1.3 Hubungan Banyak-ke-Banyak (Many-to-Many / M:N)

##### A. Anggota ─── Potensi (Melalui Tabel Persilangan `anggota_potensi`)
*   **Logika Bisnis**: Seorang Anggota warga NU dapat memiliki lebih dari satu keahlian strategis (contoh: K.H. Ahmad adalah seorang **Kyai**, sekaligus **Pengusaha** tani, dan **Pendidik/Dosen**). Sebaliknya, satu jenis kategori Potensi (misal: *Programmer* atau *Perawat*) dapat dimiliki oleh banyak warga NU.
*   **Junction Table**: `anggota_potensi`
    *   `anggota_potensi.anggota_id` (FK) mereferensikan `anggota.id`.
    *   `anggota_potensi.potensi_id` (FK) mereferensikan `potensi.id`.
*   **Aturan Integritas**: `ON DELETE CASCADE` pada kedua sisi foreign key. Jika data anggota dihapus atau kategori master potensi dihapus, entri penugasan di tabel penghubung otomatis terhapus tanpa menyisakan *broken link*.

---

### 2. STRUKTUR KHUSUS: RELASI LINKING & FALLBACK PADA PENGURUS

Entitas `PENGURUS` memiliki struktur relasi hibrida (Polymorphic-like behavior) yang fleksibel untuk menangani dinamika organisasi:

1.  **Relasi ke Sensus Anggota (`anggota_id` - Nullable)**:
    *   *Skenario Terintegrasi*: Jika pengurus bersangkutan sudah mengikuti sensus warga, datanya akan terhubung langsung via `pengurus.anggota_id` ke `anggota.id`. Profil pengurus di website publik otomatis mengambil data foto, alamat, dan kontak terbaru dari profil sensusnya.
    *   *Skenario Fallback*: Jika tokoh/pengurus senior belum sempat terdata dalam sistem sensus warga, kolom `anggota_id` bernilai `NULL`. Sistem akan menggunakan data manual di tabel `PENGURUS` (seperti kolom `name` dan `photo_url` manual) sebagai data fallback. Hal ini menjamin diagram struktur organisasi di web publik tetap tampil utuh walaupun sensus tingkat ranting sedang berjalan.
2.  **Relasi Tingkat Kepengurusan (`level`)**:
    *   Jika `level = 'MWC'`, kolom `ranting_id` dan `banom_id` bernilai `NULL`.
    *   Jika `level = 'Ranting'`, pengurus tersebut bertugas di ranting tertentu, maka wajib mengisi `ranting_id` yang mereferensikan `ranting.id`.
    *   Jika `level = 'Banom'`, pengurus bertugas di Badan Otonom tertentu (seperti Ketua PAC GP Ansor Karangpawitan), maka wajib mengisi `banom_id` yang mereferensikan `banom.id`.

---

### 3. DIAGRAM ALUR DATA VERIFIKASI SENSUS

Berikut adalah representasi transisi status data sensus anggota yang melibatkan validasi database secara dinamis:

```
[Admin Ranting] ──(Input Sensus)──> [Status: Draft]
                                          │
                                   (Ajukan Validasi)
                                          ▼
                               [Status: Menunggu Verifikasi]
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
          [Disetujui Admin MWC]                       [Ditolak / Perlu Revisi]
                   │                                             │
      (KTA Generasi Otomatis &                               (Kembali ke Draft/Revisi
       Masuk ke Dashboard Analitik)                           dilengkapi Catatan Notes)
```

Dengan spesifikasi relasi yang kokoh ini, integritas data sensus, keuangan, persuratan, dan inventaris MWC NU Karangpawitan terjamin aman dari redudansi dan ketidaksinkronan data.
