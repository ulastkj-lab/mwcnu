# DOKUMEN STRUKTUR FOLDER & ARSITEKTUR SISTEM
## SISTEM INFORMASI MANAJEMEN MWC NU KARANGPAWITAN (SIM MWC NU)

---

### 1. PENYELARASAN ARSITEKTUR KONTINER & WORKSPACE (IMPORTANT)

Sebagai **Senior Software Architect & System Analyst**, saya ingin memberikan penjelasan penting mengenai lingkungan eksekusi (runtime environment) aplikasi ini:

> ⚠️ **Catatan Infrastruktur**: Server runtime pada platform ini berjalan di dalam kontainer sandboxed berbasis **Node.js (TypeScript) & port 3000** (tanpa php-fpm/Apache/MySQL terinstal secara native di CLI kontainer). 
> 
> Agar aplikasi ini dapat berjalan secara langsung (*live preview*) dan dapat dicompile/diuji di browser interaktif Anda, kita mengimplementasikan **Arsitektur Full-Stack Modern (React 19 + Express Server + TypeScript)**. Arsitektur ini meniru seluruh pola enterprise Laravel secara 1-to-1:
> *   **Express Server (`server.ts`)** sebagai pengganti **Laravel Routing & Controllers**.
> *   **Service Layer & Repository Pattern** ditulis menggunakan TypeScript Class di server.
> *   **Drizzle ORM** sebagai pengganti **Eloquent ORM** untuk migrasi dan query data 3NF.
> *   **React SPA dengan Tailwind Emerald Theme** sebagai pengganti **Blade Template**.

Untuk memenuhi keinginan Anda, dokumen ini akan menyajikan **dua versi struktur folder**:
1.  **Arsitektur Standar Laravel 12 (Konseptual)**: Sesuai rancangan sistem enterprise PHP asli untuk referensi arsitektur organisasi Anda.
2.  **Arsitektur Aktif Full-Stack TypeScript (Praktikal)**: Struktur folder nyata yang kita bangun di dalam workspace ini agar sistem berjalan sempurna dan siap uji di browser.

---

### 2. STRUKTUR FOLDER KONSEPTUAL: LARAVEL 12 ENTERPRISE

Berikut adalah rancangan struktur folder jika diimplementasikan pada Laravel 12 dengan penerapan **Clean Architecture, Service Layer, dan Repository Pattern** yang sangat terorganisir di dalam folder `app/`:

```
sim-mwc-laravel/
├── app/
│   ├── Console/                  # Artisan Commands & Scheduled Tasks
│   │   └── Commands/
│   │       └── VerifySensusStatus.php
│   │
│   ├── Http/
│   │   ├── Controllers/          # RESTful Resource Controllers (Slim Controllers)
│   │   │   ├── Auth/
│   │   │   ├── Admin/
│   │   │   │   ├── AnggotaController.php
│   │   │   │   ├── SensusController.php
│   │   │   │   └── KeuanganController.php
│   │   │   └── Public/
│   │   │       ├── WebsiteController.php
│   │   │       └── BeritaController.php
│   │   │
│   │   ├── Middleware/           # Custom Filters & Security Checks
│   │   │   ├── AuditLogMiddleware.php
│   │   │   └── RolePermissionMiddleware.php
│   │   │
│   │   └── Requests/             # Form Request Validation (Separation of Concerns)
│   │       ├── StoreAnggotaRequest.php
│   │       ├── UpdateAnggotaRequest.php
│   │       └── StoreKeuanganRequest.php
│   │
│   ├── Models/                   # Plain Eloquent Models (No heavy logic)
│   │   ├── User.php
│   │   ├── Anggota.php
│   │   ├── AnggotaPendidikan.php
│   │   ├── AnggotaPekerjaan.php
│   │   ├── Potensi.php
│   │   ├── Ranting.php
│   │   ├── Banom.php
│   │   ├── Surat.php
│   │   └── Keuangan.php
│   │
│   ├── Repositories/             # REPOSITORY PATTERN (Database Queries abstraction)
│   │   ├── Contracts/            # Interfaces for Decoupling
│   │   │   ├── AnggotaRepositoryInterface.php
│   │   │   └── KeuanganRepositoryInterface.php
│   │   └── Eloquent/             # Concrete Implementation
│   │       ├── BaseRepository.php
│   │       ├── AnggotaRepository.php
│   │       └── KeuanganRepository.php
│   │
│   ├── Services/                 # SERVICE LAYER (Core Business Logic resides here!)
│   │   ├── Sensus/
│   │   │   ├── SensusVerificationService.php  # Handles Draft -> Approved workflow
│   │   │   └── ExcelImportService.php         # Parses and validates Excel rows
│   │   ├── Finance/
│   │   │   ├── BalanceCalculatorService.php   # Cash Book calculations
│   │   │   └── InvoiceGeneratorService.php
│   │   └── Mail/
│   │       └── LetterNumberingService.php     # Automatic official NU letter coding
│   │
│   ├── Providers/                # Service Binding & Configuration
│   │   ├── AppServiceProvider.php
│   │   └── RepositoryServiceProvider.php      # Binds Interfaces to Eloquent implementations
│   │
│   └── Policies/                 # Authorization & Security rules
│       ├── AnggotaPolicy.php
│       └── KeuanganPolicy.php
│
├── bootstrap/
├── config/
├── database/
│   ├── factories/                # Mock Data Generators for testing
│   ├── migrations/               # Strict 3NF Table Definitions
│   └── seeders/                  # System initialization data
├── public/
├── resources/
│   ├── css/
│   ├── js/
│   └── views/                    # Blade Templates (Layouts, Components, Partials)
│       ├── layouts/
│       │   ├── app.blade.php     # Dashboard Layout (Sidebar + Topbar)
│       │   └── public.blade.php  # Public Website Layout
│       ├── admin/
│       └── public/
├── routes/
│   ├── api.php
│   └── web.php
└── tests/
```

---

### 3. STRUKTUR FOLDER REAL: MODERN FULL-STACK TYPESCRIPT (REACT + EXPRESS)

Struktur ini adalah struktur nyata yang kita implementasikan di workspace kontainer ini. Kami mempertahankan pemisahan tanggung jawab yang persis sama dengan arsitektur Laravel enterprise di atas:

```
/ (Workspace Root)
├── .env.example                  # Environment blueprint
├── metadata.json                 # System permissions & App name
├── package.json                  # Framework & Library dependencies
├── vite.config.ts                # Build automation
├── tsconfig.json                 # TS Compiler settings
├── index.html                    # Single Page Application root
│
├── src/                          # SOURCE CODE
│   ├── main.tsx                  # Client entry point
│   ├── App.tsx                   # Client Router / View Controller
│   ├── index.css                 # Global Tailwind CSS definitions (Theme NU Emerald)
│   │
│   ├── db/                       # DATABASE LAYER (Replica of Laravel database/)
│   │   ├── schema.ts             # 3NF Schema Definitions (Drizzle ORM Tables)
│   │   ├── connection.ts         # Pool client connection
│   │   ├── seed.ts               # Seeder data (Ranting, Potensi, Users, Anggota)
│   │   └── migrations/           # Compiled SQL migrations
│   │
│   ├── server/                   # BACKEND EXPRESS SERVER (Replica of Laravel app/)
│   │   ├── server.ts             # Server Entry Point & Express middleware
│   │   │
│   │   ├── middleware/           # REPLICA: Http/Middleware/
│   │   │   ├── auth.ts           # Authentication & Session verification
│   │   │   ├── rbac.ts           # Custom RolePermission checker (Spatie replica)
│   │   │   └── auditLog.ts       # Audit logging logger
│   │   │
│   │   ├── repositories/         # REPLICA: Repositories/ (Data Access)
│   │   │   ├── AnggotaRepository.ts
│   │   │   ├── KeuanganRepository.ts
│   │   │   └── SuratRepository.ts
│   │   │
│   │   ├── services/             # REPLICA: Services/ (Core Business Logic)
│   │   │   ├── SensusService.ts  # Workflow verifikasi & validasi NIK
│   │   │   ├── FinanceService.ts # Rekonsiliasi saldo kas organisasi
│   │   │   └── LetterService.ts  # Auto-numbering format surat dinas NU
│   │   │
│   │   └── controllers/          # REPLICA: Http/Controllers/ (API Routes handling)
│   │       ├── authController.ts
│   │       ├── anggotaController.ts
│   │       ├── keuanganController.ts
│   │       └── publicController.ts
│   │
│   ├── components/               # REPLICA: resources/views/components/
│   │   ├── ui/                   # Reusable UI Elements (Buttons, Inputs, Modals)
│   │   ├── layouts/              # Shared Frame (AppLayout.tsx, PublicLayout.tsx)
│   │   ├── dashboard/            # Analytical Widgets & Graphs
│   │   └── common/               # Loading, Error boundary, Toast notifications
│   │
│   ├── views/                    # REPLICA: resources/views/
│   │   ├── public/               # Public Website Pages (Home, Profil, Berita, Kontak)
│   │   ├── auth/                 # Login & Registration Pages
│   │   └── admin/                # Dashboard Admin & CRUD views (Sensus, Keuangan, dsb)
│   │
│   ├── types/                    # GLOBAL SCHEMAS (Replica of Laravel Models definition)
│   │   └── index.ts              # Custom TypeScript interfaces for Anggota, Surat, etc.
│   │
│   └── utils/                    # Helper functions (Date formatter, Excel, PDF exporters)
│       ├── excel.ts
│       ├── pdf.ts
│       └── format.ts
```

---

### 4. PENJELASAN ALIRAN LOGIKA BISNIS (DATA FLOW)

Pola komunikasi antar-layer dirancang seragam baik di model Laravel maupun di model TypeScript yang kita kembangkan:

```
[Client / Browser]
       │
   (HTTP Request)
       ▼
[Express Server / routes]
       │
[Security Middleware / RBAC]  <--- Memeriksa otentikasi & hak akses role
       │
[Controller Endpoint]        <--- Menangani parsing parameter & Form Validation
       │
[Service Layer]              <--- CORE LOGIC: Validasi NIK, Penomoran Surat, hitung saldo
       │
[Repository Layer]           <--- Membaca & menulis ke database menggunakan ORM
       │
  [Database MySQL]
```

Pemisahan ini menjamin kode program sangat mudah dibaca, aman dari kebocoran otorisasi, terbebas dari duplikasi logika bisnis, serta sangat mudah diuji (*testable*).

---

*Dengan disetujuinya Analisis Kebutuhan, ERD, Relasi Tabel, dan Struktur Folder ini, kita siap melangkah ke **Tahap Selanjutnya: Implementasi Skema Migrasi Database (Migration & Seeders)***.
