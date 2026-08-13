# DOKUMEN SPESIFIKASI ANALISIS KEBUTUHAN (SRS)
## SISTEM INFORMASI MANAJEMEN MWC NU KARANGPAWITAN (SIM MWC NU)

---

### 1. PENDAHULUAN & PENYELARASAN ARSITEKTUR

#### 1.1 Latar Belakang & Tujuan
**Sistem Informasi Manajemen Majelis Wakil Cabang Nahdlatul Ulama (SIM MWC NU) Karangpawitan** dirancang sebagai platform enterprise terpadu yang mengintegrasikan **Portal Publik (Website Resmi)** dan **Sistem Administrasi Internal (Dashboard Organisasi)**. 

Tujuan utama dari sistem ini adalah:
1. **Representasi Digital**: Menjadi media informasi resmi perjuangan, dakwah, berita, dan agenda MWC NU Karangpawitan bagi khalayak umum.
2. **Tertib Administrasi**: Digitalisasi tata kelola organisasi meliputi persuratan, inventaris, keuangan, dan agenda kegiatan secara real-time.
3. **Sensus & Database Warga (Kartanu)**: Pengumpulan data warga NU di tingkat Kecamatan Karangpawitan secara akurat, terstruktur, dan valid melalui sistem sensus bertahap.
4. **Pemetaan Potensi SDM**: Pemetaan keahlian, profesi, pendidikan, dan peran strategis warga NU untuk mengoptimalkan potensi umat.

#### 1.2 Penyelarasan Stack Teknologi (Architectural Shift)
Sebagai *Senior Software Architect*, demi menyesuaikan dengan ekosistem runtime sandboxed **Google AI Studio** yang berbasis **Node.js, React (TypeScript), Vite, Tailwind CSS, dan Express**, kita akan melakukan pemetaan pola arsitektur dari Laravel (PHP) ke **Modern Full-Stack TypeScript Enterprise Architecture**:

| Komponen Laravel | Pemetaan ke Stack TypeScript Enterprise (SIM MWC NU) |
| :--- | :--- |
| **Blade Template** | **React SPA (Vite + TS)** dengan performa rendering instan dan transisi yang halus menggunakan `motion`. |
| **Laravel Breeze / Auth** | **Custom JWT/Session-based Authentication** dengan Express Session, dienkripsi aman, serta route protection di sisi Client dan Server. |
| **Spatie Permission** | **Custom RBAC (Role-Based Access Control) Engine** berbasis Middleware di backend Express dan Route Guarding/Conditional Rendering di frontend React. |
| **Eloquent ORM & MySQL** | **Drizzle ORM / Prisma ORM** terkoneksi ke **PostgreSQL (Cloud SQL)** atau SQLite lokal berkinerja tinggi, menjamin integritas relasi tabel (foreign keys) dan normalisasi 3NF. |
| **Bootstrap 5 & Tailwind** | **Tailwind CSS** dengan tema premium **Elegant NU Emerald (Slate-Green)**, responsif penuh, tipografi "Space Grotesk" & "Inter", dan komponen mikro-interaktif. |
| **Laravel Excel & DomPDF** | **SheetJS (xlsx)** di frontend/backend dan **PDF Generator (PDFKit/jsPDF)** untuk ekspor data berkinerja tinggi tanpa membebani server. |
| **Chart.js & Leaflet.js** | **Recharts/Chart.js** untuk grafik analitik interaktif, serta **React-Leaflet** untuk visualisasi peta spasial sebaran warga di tingkat Ranting/Desa. |
| **SweetAlert2 & DataTables** | **Tailwind-based Dialog Modals** didukung **Toast Notification** dari lucide-react + custom state, serta **TanStack Table (React Table)** untuk server-side pagination, search, dan multi-filtering. |

---

### 2. MATRIKS PERAN PENGGUNA (ROLE-BASED ACCESS CONTROL - RBAC)

Sistem menggunakan kontrol akses berbasis peran (RBAC) yang sangat ketat untuk memisahkan fungsi publik, operator data, pengambil keputusan, dan administrator sistem.

| No | Role | Deskripsi Fungsi & Hak Akses |
| :--- | :--- | :--- |
| **1** | **Super Admin** | Hak akses penuh (Full Control). Mengelola manajemen user (CRUD semua user dan penugasan role), konfigurasi sistem, audit log aktivitas, backup database, dan verifikasi akhir semua modul. |
| **2** | **Ketua MWC** | Akses eksekutif (Viewer Utama). Melihat seluruh dashboard statistik, laporan keuangan, peta sebaran warga, daftar inventaris, serta memberikan disposisi atas surat masuk secara digital. |
| **3** | **Sekretaris** | Mengelola persuratan (Surat Masuk, Surat Keluar, Disposisi), agenda organisasi, manajemen pengurus, dokumen resmi (SK, AD/ART), inventaris barang, serta publikasi berita/galeri. |
| **4** | **Bendahara** | Mengelola penuh Modul Keuangan (pemasukan, pengeluaran, kas ranting, pembuatan laporan bulanan/tahunan, serta verifikasi bukti transaksi/iuran warga). |
| **5** | **Operator** | Mengelola penginputan data umum, pengurus, agenda, dan memelihara pembaruan berita/galeri di bawah pengawasan Sekretaris. |
| **6** | **Admin Ranting** | Menginput data Sensus Anggota NU di wilayah desanya sendiri. Hanya memiliki akses tulis untuk data warga di rantingnya (status awal: *Draft* atau *Menunggu Verifikasi*). |
| **7** | **Admin Banom** | Mengelola database keanggotaan dan kegiatan Badan Otonom terkait (GP Ansor, Muslimat, Fatayat, IPNU, IPPNU) di tingkat anak cabang Karangpawitan. |
| **8** | **Viewer** | Akses baca saja (Read-Only) ke modul-modul administrasi internal tertentu (misal: pengurus ranting yang ingin melihat data sebaran tanpa hak mengubah). |

---

### 3. SPESIFIKASI FUNGSIONAL PER MODUL

#### 3.1 Website Publik (Portal Resmi)
*   **Beranda (Homepage)**: Hero banner dinamis dengan foto kegiatan, widget pencarian cepat warga NU (cek status anggota/KTA), sekilas berita terbaru, dan peta ringkas sebaran ranting.
*   **Profil, Sejarah, & Visi Misi**: Halaman statis yang dikelola melalui admin panel dengan visualisasi garis waktu (timeline) sejarah berdirinya MWC NU Karangpawitan.
*   **Struktur Organisasi & Pengurus**: Tampilan bagan pengurus (Syuriah, Tanfidziyah) interaktif berdasarkan periode kepengurusan yang aktif.
*   **Berita & Agenda Publik**: Daftar artikel dakwah, warta kegiatan, dan kalender kegiatan mendatang lengkap dengan filter kategori.
*   **Galeri & Download**: Album dokumentasi kegiatan (foto/video) serta portal unduhan dokumen publik (seperti lembaran kepengurusan, formulir KTA, majalah dakwah).
*   **Buku Tamu & Kontak**: Formulir interaktif bagi masyarakat umum untuk mengirim pesan/saran, terintegrasi langsung ke sistem notifikasi admin internal.

#### 3.2 Dashboard Analitik Internal
*   **Statistik Real-time Card**: Menampilkan metrik total Anggota NU terverifikasi, jumlah Ranting (Desa) aktif, jumlah pengurus aktif, surat masuk belum diproses, saldo kas organisasi, dan agenda hari ini.
*   **Visualisasi Grafis (Chart.js)**:
    *   *Tren Pertumbuhan Warga*: Grafik garis (line chart) pendaftaran sensus bulanan.
    *   *Demografi Pendidikan*: Grafik donat (doughnut chart) tingkat pendidikan warga (SD, SMP, SMA, S1, S2, S3, Pesantren).
    *   *Demografi Profesi & Potensi*: Grafik batang (bar chart) profesi dan keahlian mayoritas warga.
*   **Peta Interaktif (Leaflet.js)**: Peta Kecamatan Karangpawitan yang terbagi menjadi kelurahan/desa (ranting). Menggunakan choropleth warna (semakin padat warga, warna hijau semakin pekat) dan pin/marker lokasi koordinat warga/posko ranting.
*   **Feed Aktivitas Terbaru & Notifikasi**: Audit log real-time mengenai siapa yang baru mengunggah surat, memverifikasi sensus, atau mencatat transaksi keuangan.

#### 3.3 Modul Pengurus & Struktur Organisasi
*   **Data Pengurus MWC**: Pencatatan riwayat hidup, foto formal kepengurusan, Jabatan (Rois Syuriah, Katib, Ketua Tanfidziyah, Sekretaris, Bendahara, A'wan, dll).
*   **Manajemen SK (Surat Keputusan)**: Upload file SK Kepengurusan, penetapan tanggal mulai dan masa khidmat (periode, misal: 2024-2029).
*   **Status Keaktifan**: Mengubah status pengurus (Aktif, Demisioner, Mutasi, Wafat) disertai riwayat jabatan historis di NU.

#### 3.4 Modul Ranting (Tingkat Desa)
*   **Identitas Ranting**: Pendaftaran 20 Ranting NU (sesuai jumlah desa/kelurahan di Karangpawitan, seperti Karangpawitan, Situgede, Godog, Sindanggalih, dsb).
*   **Struktur Ranting**: Pencatatan Ketua Tanfidziyah Ranting, Sekretaris, Bendahara, dan kontak resmi.
*   **Geolokasi Kantor/Sekretariat**: Koordinat latitude/longitude untuk plotting peta spasial.

#### 3.5 Modul Badan Otonom (Banom) & Lembaga
*   **Database Banom**: Klasifikasi data berdasarkan Banom (GP Ansor, Banser, Muslimat, Fatayat, IPNU, IPPNU, Pagar Nusa) dan Lembaga (LDNU, LazisNU, LP Ma'arif, LKNU, dll).
*   **Relasi Struktural**: Pemetaan kepengurusan Banom ke tingkat Ranting/Desa masing-masing.

#### 3.6 Modul Sensus Anggota NU & Potensi SDM
Ini adalah modul paling masif yang menerapkan **Normalisasi Database 3NF** untuk memisahkan data identitas utama, data pendidikan, data pekerjaan, dan relasi multi-potensi.
*   **Data Identitas**: NIK (Validasi 16 digit, unik), No KK, Nama Lengkap, Jenis Kelamin, TTL, Alamat lengkap, RT/RW, Desa/Ranting, HP, Email, Foto KTA, Status Pernikahan, dan Status Hidup.
*   **Pendidikan & Pesantren**: Riwayat pendidikan formal, riwayat mondok di Pondok Pesantren (nama pesantren, tahun, alumni).
*   **Pekerjaan & UMKM**: Jenis profesi (PNS, Swasta, Petani, Buruh, Guru, dsb), nama instansi, serta sub-modul UMKM (mencatat aset usaha warga untuk pemetaan ekonomi umat).
*   **Relasi Multi-Potensi (Many-to-Many)**: Menghubungkan satu anggota ke banyak potensi keahlian (Kyai, Ustadz, Qori, Hafidz, IT, MC, Medis, Tukang, dsb).
*   **Workflow Verifikasi Sensus**:
    1.  *Draft*: Data baru dimasukkan oleh Admin Ranting.
    2.  *Menunggu Verifikasi*: Operator Ranting mengajukan data untuk divalidasi.
    3.  *Revisi/Ditolak*: Jika data NIK ganda atau foto tidak jelas, dikembalikan ke Admin Ranting dengan catatan.
    4.  *Disetujui*: Terverifikasi oleh Super Admin / Operator MWC, otomatis mendapat Nomor KTA Sistem dan masuk ke grafik analitik publik.
*   **Import/Export Excel**: Format template Excel yang presisi untuk mempermudah migrasi data offline massal oleh pengurus ranting.

#### 3.7 Modul Administrasi Persuratan (Digital Archive)
*   **Surat Masuk**: Pencatatan nomor surat, tanggal terima, asal surat, perihal, ringkasan isi, scan PDF dokumen asli, dan penanggung jawab disposisi.
*   **Surat Keluar**: Pembuatan draf surat, penomoran otomatis berdasarkan tata kearsipan NU (kode surat khidmat/tanfidziyah), tanggal keluar, tujuan, dan arsip PDF final yang ditandatangani.
*   **Lembar Disposisi**: Ketua MWC dapat mengklik surat masuk, menulis arahan disposisi secara digital, dan menugaskan Sekretaris/Banom terkait dengan status pelacakan (*Belum Diproses*, *Sedang Ditindaklanjuti*, *Selesai*).

#### 3.8 Modul Keuangan (Sistem Kas Terpadu)
*   **Kategori Transaksi**: Pengelompokan kas (Iuran Anggota, Koin NU/LazisNU, Donatur Tetap, Pengeluaran Operasional, Bantuan Sosial, dsb).
*   **Buku Kas Umum (BKU)**: Pencatatan debit, kredit, saldo berjalan, bukti transaksi (upload kuitansi/nota/bukti transfer).
*   **Laporan Keuangan**: Laporan bulanan dan tahunan otomatis yang siap diekspor ke PDF dengan format neraca standar akuntansi organisasi nirlaba.

#### 3.9 Modul Agenda & Kegiatan (Kalender Organisasi)
*   **Kalender Kegiatan (FullCalendar style)**: Jadwal pengajian rutin, rapat pleno, Lailatul Ijtima, konferensi ranting, dan hari besar Islam.
*   **Absensi Kehadiran & Notulensi**: Pengisian daftar hadir pengurus/peserta rapat secara digital (bisa menggunakan scan QR Code sederhana di lokasi), penginputan poin-poin keputusan rapat (Notulen), serta dokumentasi foto kegiatan.

#### 3.10 Modul Inventaris & QR Code
*   **Pencatatan Aset**: Kode inventaris unik (misal: *INV/MWC-KP/2026/001*), nama barang (mobil siaga, tenda, kursi, sound system, laptop), lokasi penyimpanan, dan kondisi barang (Baik, Rusak Ringan, Rusak Berat).
*   **QR Code Generator**: Setiap aset secara otomatis mendapatkan QR Code yang dapat dicetak dan ditempel di fisik barang. Scan QR Code akan membuka halaman detail status barang secara instan di HP pengurus.
*   **Log Peminjaman**: Pencatatan siapa pengurus/ranting yang meminjam aset, tanggal pinjam, estimasi kembali, kondisi saat dipinjam, dan kondisi saat dikembalikan.

#### 3.11 Modul Berita, Artikel & Galeri (CMS)
*   **Manajemen Konten (CMS)**: Integrasi Rich Text Editor (TinyMCE/Slate) untuk penulisan artikel dakwah dan berita kegiatan, pengaturan slug URL SEO-friendly, penentuan kategori (Kabar Ranting, Opini Dakwah, Pengumuman), tag, serta penjadwalan publish (Draft vs Published).
*   **Galeri Foto & Video**: Pengelompokan dokumentasi berdasarkan album kegiatan (Multi-upload files dengan optimasi kompresi otomatis).

---

### 4. SPESIFIKASI NON-FUNGSIONAL & KEAMANAN

#### 4.1 Keamanan Sistem (Security Hardening)
1.  **Authentication & Authorization Security**:
    *   Enkripsi password menggunakan algoritma hashing bcrypt yang kuat.
    *   Penggunaan JWT (JSON Web Token) atau secure session cookies dengan flag `HttpOnly`, `Secure`, dan `SameSite=Strict`.
    *   Route Guards di sisi frontend React untuk membatasi akses URL secara ilegal.
2.  **Input Sanitization & Protection**:
    *   Sanitasi ketat terhadap input Rich Text Editor untuk mencegah serangan **XSS (Cross-Site Scripting)**.
    *   Gunakan parameterized queries atau ORM type-safe untuk mencegah **SQL Injection**.
    *   Implementasi **CSRF Protection** pada setiap transaksi mutasi data.
    *   Validasi ukuran dan tipe file (hanya memperbolehkan PDF/JPG/PNG dengan batas maksimal 2MB untuk mencegah upload shell script berbahaya).
3.  **Rate Limiter & Audit Trail**:
    *   Membatasi percobaan login salah maksimal 5 kali dalam 15 menit menggunakan Rate Limiter di backend.
    *   *Activity Log (Audit Trail)*: Mencatat setiap aktivitas krusial (siapa melakukan apa, pada data apa, jam berapa, dari IP mana) khususnya pada verifikasi sensus dan transaksi keuangan.

#### 4.2 Kinerja & Keandalan (Performance & Scalability)
1.  **State Management & Re-render Prevention**:
    *   Aplikasi frontend React dirancang modular menggunakan *React.memo*, *useCallback*, dan optimasi state local guna menghindari re-render yang tidak perlu.
2.  **Data Grid Efficiency**:
    *   Tabel data besar (seperti daftar warga hasil sensus yang bisa mencapai ribuan record) wajib menggunakan *Server-Side Pagination, Filtering, dan Sorting* melalui API Endpoint, sehingga browser tidak mengalami hang saat merender data.
3.  **File Storage Optimization**:
    *   File scan surat, foto pengurus, dan galeri disimpan secara terstruktur dengan penamaan unik berbasis UUID di folder storage, dengan opsi integrasi Cloud Storage untuk skalabilitas di masa depan.
4.  **Responsive Design**:
    *   Antarmuka sepenuhnya responsif menggunakan grid Tailwind CSS, mendukung perangkat mobile (smartphone kader di lapangan saat sensus) hingga monitor desktop di kantor sekretariat.
    *   Target sentuh (touch targets) tombol di perangkat seluler minimal berukuran 44px x 44px untuk kenyamanan input data sensus.

---

### 5. USULAN RENCANA PENGEMBANGAN (ROADMAP BERTAHAP)

Sesuai instruksi tertulis, kita akan melangkah secara disiplin per tahap. Berikut adalah pembagian milestone yang akan kita lakukan:

*   **TAHAP 1: Analisis Kebutuhan (Sedang Berjalan - Menunggu Persetujuan Anda)**
*   **TAHAP 2: Perancangan ERD & Skema Database (Normalisasi 3NF Lengkap)**
*   **TAHAP 3: Relasi Antar Tabel & Arsitektur Folder Proyek TypeScript**
*   **TAHAP 4: Implementasi Skema Migration & Database Seeder/Factory**
*   **TAHAP 5: Implementasi Model, Repository, & Security Middleware/RBAC**
*   **TAHAP 6: Pembuatan API Router & Form Request Validation (Express Backend)**
*   **TAHAP 7: Pengembangan Layout & UI Base Component (React + Tailwind Emerald Theme)**
*   **TAHAP 8: Implementasi Fitur CRUD Modul-Modul Utama (Ranting, Pengurus, Banom)**
*   **TAHAP 9: Implementasi Modul Sensus Anggota & Engine Verifikasi Sensus**
*   **TAHAP 10: Implementasi Modul Mapping Potensi, Chart.js, & Spasial Leaflet Map**
*   **TAHAP 11: Implementasi Modul Administrasi Surat & Agenda Kegiatan**
*   **TAHAP 12: Implementasi Modul Keuangan & Modul Inventaris QR Code**
*   **TAHAP 13: Pengembangan Website Publik, CMS Berita, & Portal Download**
*   **TAHAP 14: Verifikasi Akhir (Linting, Compilation, & Security Check)**
*   **TAHAP 15: Dokumentasi Instalasi, Panduan Penggunaan, & Serah Terima Sistem**

---

*Dokumen ini disusun oleh Senior Software Architect & System Analyst untuk menjamin sistem informasi manajemen yang kokoh, modern, dan andal bagi kemajuan MWC NU Karangpawitan.*
