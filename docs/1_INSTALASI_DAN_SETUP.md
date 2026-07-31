# 1. Panduan Instalasi & Setup Sistem Enterprise BUMDes Banyubening

Dokumen ini menjelaskan spesifikasi lingkungan, prosedur instalasi dari nol, konfigurasi variabel lingkungan (*environment variables*), sinkronisasi skema database, pengisian data awal (*seeder*), serta panduan penggunaan aplikasi secara lokal maupun server.

---

## A. Spesifikasi & Persyaratan Sistem
Sistem BUMDes Banyubening berarsitektur *Monorepo* modern yang membutuhkan lingkungan kerja dengan spesifikasi berikut:
- **Sistem Operasi**: Linux (Ubuntu/Debian/Alpine), macOS, atau Windows (WSL2 / Native)
- **Node.js**: Versi `v20.x` atau `v22.x` (LTS direkomendasikan)
- **NPM**: Versi `v10.x` atau lebih baru
- **Database**: 
  - Produksi: **Supabase PostgreSQL** (Managed Service berstandard ACID Compliance)
  - Pengembangan / Pengujian Lokal: **SQLite** (`dev.db` dengan *zero-config fallback* otomatis)
- **Cache & Queue**: 
  - Produksi: **Redis Server** (port standar 6379)
  - Pengembangan / Pengujian Lokal: **Enterprise In-Memory Cache & Queue Fallback** (otomatis aktif bila server Redis offline)

---

## B. Prosedur Instalasi & Setup Langkah demi Langkah

### 1. Kloning Repositori
```bash
git clone <url-repositori-bumdes>
cd BUMDes-BANYUBENING
```

### 2. Instalasi Dependensi Seluruh Workspace
Repositori dikonfigurasi sebagai NPM Workspaces (`backend`, `public-app`, `admin-app`). Jalankan perintah instalasi dari direktori akar repositori:
```bash
npm install
```
*Catatan Keamanan Offline*: Script `postinstall` secara otomatis memvalidasi dan menyiapkan binary *query engine* dan *schema engine* Prisma yang telah terverifikasi secara offline pada folder `backend/prisma/engines/`. Tidak ada unduhan jaringan eksternal yang diperlukan saat menjalankan `npm install`, `npx prisma generate`, atau `npm test`.

### 3. Konfigurasi Berkas Environment Variables (.env)
Gunakan perintah otomatis berikut yang mendukung **semua sistem operasi (Windows, Linux, macOS)**:
```bash
npm run setup:env
```
*Atau secara manual sesuai terminal yang Anda gunakan:*
- **Windows Command Prompt (CMD)**:
  ```cmd
  copy .env.example .env
  copy .env.example backend\.env
  ```
- **Windows PowerShell**:
  ```powershell
  Copy-Item .env.example .env
  Copy-Item .env.example backend/.env
  ```
- **Linux / macOS / Git Bash**:
  ```bash
  cp .env.example .env
  cp .env.example backend/.env
  ```
Pastikan isi berkas `.env` mencantumkan kredensial utama:
```env
# Server & Port Configuration
PORT=4000
NODE_ENV=development
PUBLIC_APP_URL=http://localhost:3000
ADMIN_APP_URL=http://localhost:3001
API_URL=http://localhost:4000

# Database Configuration (Supabase PostgreSQL / SQLite fallback untuk tes lokal)
DATABASE_URL="file:../dev.db"

# Admin Authentication 2FA Credentials (dikelola via Vercel/VPS Env Vars)
ADMIN_EMAIL="admin@bumdesbanyubening.id"
ADMIN_PASSWORD_HASH="BanyuBening2026!"
ADMIN_PIN="1234567890"
ADMIN_WA_NUMBER="081234567890"

# Security & JWT Tokens
JWT_ACCESS_SECRET="bumdes_banyubening_access_secret_enterprise_key_2026_super_secure"
JWT_REFRESH_SECRET="bumdes_banyubening_refresh_secret_enterprise_key_2026_super_secure"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# WhatsApp Bot & Fonnte Gateway Integration
FONNTE_TOKEN="demo_fonnte_token_bumdes_banyubening"
FONNTE_API_URL="https://api.fonnte.com/send"
FONNTE_WEBHOOK_SECRET="bumdes_fonnte_webhook_secret_2026"

# Redis Cache & Queue
REDIS_URL="redis://localhost:6379"

# Google Drive Backup & Disaster Recovery
GOOGLE_DRIVE_FOLDER_ID="1BUMDesBanyubeningBackupFolderIdExample2026"
GOOGLE_SERVICE_ACCOUNT_EMAIL="backup-service@bumdes-banyubening.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
```

### 4. Sinkronisasi Skema Database & Seeding Data Awal
Untuk membuat struktur tabel dan mengisi data awal enterprise BUMDes (Master Admin, Identitas Resmi, 8 Personel Pengurus The Floating Leaf, 6 Katalog Produk, Program Kerja ber-blok dengan komentar Instagram-style, serta berita):
```bash
npm run db:push
npm run seed
```

---

## C. Cara Penggunaan & Menjalankan Platform

### 1. Menjalankan Seluruh Aplikasi Secara Bersamaan (1 Perintah)
Anda tidak perlu lagi membuka 3 terminal terpisah! Cukup jalankan satu perintah berikut dari direktori akar `BUMDes-BANYUBENING`:

```bash
# Menjalankan Backend API + Situs Publik + Admin Dashboard BERSAMAAN:
npm run dev
```

*Atau jika ingin menjalankan hanya kedua aplikasi frontend (Publik + Admin) secara bersamaan:*
```bash
npm run dev:apps
```

- **Backend API & Socket.IO**: Berjalan pada port **4000** (`http://localhost:4000/health`)
- **Situs Publik Read-Only**: Berjalan pada port **3000** (`http://localhost:3000`)
- **Admin Dashboard Control**: Berjalan pada port **3001** (`http://localhost:3001/gerbang-internal-bumdes`)

*Opsional: Untuk menjalankan di terminal terpisah masing-masing:*
```bash
npm run dev:backend   # Backend saja (Port 4000)
npm run dev:public    # Situs publik saja (Port 3000)
npm run dev:admin     # Admin dashboard saja (Port 3001)
```
  Aplikasi admin akan berjalan pada port **3001** (`http://localhost:3001`).

### 2. Membangun Versi Produksi (Production Build)
Untuk melakukan kompilasi TypeScript dan pembuatan berkas *production build* untuk ketiga workspace:
```bash
npm run build
```
Seluruh komponen terverifikasi lulus kompilasi dengan 0 kesalahan dan 0 peringatan.

---

## D. Panduan Troubleshooting & Pemecahan Masalah
1. **Kesalahan `PrismaClientInitializationError: cannot open shared object file`**:
   - Sistem secara otomatis menggunakan binari yang terdapat di dalam `backend/prisma/engines/`. Pastikan berkas `schema-engine` dan `libquery_engine.so.node` memiliki hak akses eksekusi:
     ```bash
     chmod +x backend/prisma/engines/*
     ```
2. **Koneksi Socket.IO Tidak Terhubung pada Frontend**:
   - Pastikan variabel `NEXT_PUBLIC_API_URL` pada `.env` di aplikasi frontend mengarah ke alamat backend yang benar (default: `http://localhost:4000`).
3. **Pengiriman OTP WhatsApp Tidak Sampai ke Nomor Admin**:
   - Jika `FONNTE_TOKEN` diisi dengan token demo (`demo_fonnte_token_bumdes_banyubening`) atau dalam mode pengembangan (`NODE_ENV=development`), sistem akan mengaktifkan *Simulated Gateway*. Kode OTP valid 6 digit dapat dilihat langsung pada respons API atau log Pino di Terminal 1.
