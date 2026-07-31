# Platform Enterprise BUMDes Banyubening

**Platform Fullstack Enterprise BUMDes Banyubening** dirancang dan dibangun dengan standar arsitektur tingkat lanjut (*Senior Principal Fullstack Engineering*) untuk mendukung kemandirian ekonomi desa, transparansi anggaran, pengelolaan mata air bening pegunungan, serta pemberdayaan UMKM di Desa Banyubening, Kecamatan Bejen, Kabupaten Temanggung, Jawa Tengah.

---

## Daftar Isi
1. [Arsitektur & Spesifikasi Teknologi](#1-arsitektur--spesifikasi-teknologi)
2. [Instalasi & Setup Sistem](#2-instalasi--setup-sistem)
3. [Penggunaan Platform (Publik & Admin)](#3-penggunaan-platform-publik--admin)
4. [Sistem Otentikasi 2FA Berlapis & Pengelolaan Kredensial](#4-sistem-otentikasi-2fa-berlapis--pengelolaan-kredensial)
5. [Panduan Admin Dashboard Tanpa Coding](#5-panduan-admin-dashboard-tanpa-coding)
6. [Sistem Program Kerja (Modern Rustic Interactive Showcase)](#6-sistem-program-kerja-modern-rustic-interactive-showcase)
7. [Sistem Integrasi WhatsApp (Fonnte Gateway, OTP & Live Chat Pengaduan)](#7-sistem-integrasi-whatsapp-fonnte-gateway-otp--live-chat-pengaduan)
8. [Sistem Tema Liburan Dinamis (No-Code Switching)](#8-sistem-tema-liburan-dinamis-no-code-switching)
9. [Sistem Laporan (PDF & Excel) & Log Audit Imutabel](#9-sistem-laporan-pdf--excel--log-audit-imutabel)
10. [Backup & Disaster Recovery (Google Drive Integration)](#10-backup--disaster-recovery-google-drive-integration)
11. [Panduan Generate Token serta Penggunaannya](#11-panduan-generate-token-serta-penggunaannya)
12. [Penjelasan Lengkap Cara Kerja Deployment (Vercel & VPS/Railway)](#12-penjelasan-lengkap-cara-kerja-deployment-vercel--vpsrailway)
13. [Pengujian Otomatis (Test Suite)](#13-pengujian-otomatis-test-suite)
14. [Daftar Lengkap Berkas Dokumentasi Teknis (`docs/`)](#14-daftar-lengkap-berkas-dokumentasi-teknis-docs)

---

## 1. Arsitektur & Spesifikasi Teknologi

Sistem mengadopsi arsitektur *monorepo modern* yang terdiri dari tiga lapisan utama:

- **Backend API (`backend/`)**: Node.js + Express.js + Prisma ORM dengan arsitektur modular berlapis (`Route → Controller → Service → Repository → Prisma`). Tidak ada logika bisnis di dalam `controller`. Semua interaksi database menggunakan query ber-parameter bebas *SQL Injection*, mendukung ACID compliance, dan transaksi Prisma.
- **Situs Publik (`public-app/`)**: Next.js 14 App Router (Port `3000`), berdesain *read-only single-page layout* dengan estetika **Air Bening Gunung & Hijau Pedesaan**. Menampilkan jam digital **Tetesan Embun Pagi**, *Running Text Ticker* bergradasi embun dengan indikator emoji kategori, **The Floating Leaf** (karosel pengurus dengan foto sirkular & modal detail), serta **Katalog Produk (Showcase: Gambar, Nama, Harga, Stok tanpa aktivitas e-commerce)**.
- **Admin Dashboard (`admin-app/`)**: Next.js 14 App Router (Port `3001`), dikonfigurasi khusus pada domain terpisah tidak terdaftar (*unlisted domain*) dengan perlindungan indeks mesin pencari (`robots.txt Disallow: /` & HTTP Header `X-Robots-Tag: noindex, nofollow`).

### Spesifikasi Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Lucide Icons, Socket.IO Client, `jspdf`, `html2canvas`.
- **Backend**: Express.js, Prisma ORM, Supabase (PostgreSQL-based managed service) dengan dukungan zero-config SQLite untuk pengujian lokal, Redis (Cache & Queue, tersinkron dengan fallback in-memory otomatis), Socket.IO Server (Realtime push update), Pino (Logger berbasis JSON).
- **Keamanan**: JWT (Access Token 15 menit + Refresh Token 7 hari), `bcryptjs`, `helmet`, rate limiter IP lockout, proteksi Cloudflare Turnstile / reCAPTCHA v3.

---

## 2. Instalasi & Setup Sistem

### Persyaratan Lingkungan
- **Node.js** v20+ atau v22+
- **NPM** v10+

### Langkah Instalasi Lokal
1. **Kloning Repositori**:
   ```bash
   git clone <repo-url>
   cd BUMDes-BANYUBENING
   ```

2. **Instalasi Seluruh Dependensi Workspace**:
   ```bash
   npm install
   ```
   *Catatan*: Script `postinstall` secara otomatis menyiapkan *query engine* Prisma lokal di direktori `backend/prisma/engines/` sehingga tidak membutuhkan koneksi jaringan eksternal ke CDN Prisma saat instalasi maupun pengujian.

3. **Konfigurasi Environment Variable (.env)**:
   Gunakan perintah universal berikut agar berlaku di **semua sistem operasi (Windows, Linux, macOS)** tanpa error terminal:
   ```bash
   npm run setup:env
   ```
   *Atau secara manual berdasarkan sistem operasi yang Anda gunakan:*
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

4. **Sinkronisasi Schema Database & Pengisian Data Awal (Seeder)**:
   ```bash
   npm run db:push
   npm run seed
   ```
   Seeder akan membuat pengguna Master Admin, identitas resmi BUMDes Banyubening, 8 personel pengurus *The Floating Leaf*, program kerja ber-blok dengan komentar Instagram-style, 6 produk katalog lengkap, unit usaha, dan berita.

---

## 3. Penggunaan Platform (Publik & Admin)

### Menjalankan Seluruh Aplikasi Secara Bersamaan (1 Perintah)
Gunakan perintah otomatis berikut agar **Backend API (Port 4000), Situs Publik (Port 3000), dan Admin Dashboard (Port 3001)** berjalan bersamaan dalam satu terminal:
```bash
npm run dev
```
*Atau jika hanya ingin menjalankan kedua aplikasi frontend (Publik + Admin) secara bersamaan:*
```bash
npm run dev:apps
```
*Atau secara terpisah di terminal masing-masing (opsional):*
```bash
npm run dev:backend   # Terminal 1: Backend Express API (Port 4000)
npm run dev:public    # Terminal 2: Situs Publik Read-Only (Port 3000)
npm run dev:admin     # Terminal 3: Admin Dashboard (Port 3001)
```

- **Akses Situs Publik**: Buka browser ke `http://localhost:3000` (atau domain publik `https://bumdesbanyubening.plipir.id`).
- **Akses Admin Dashboard**: Buka browser ke `http://localhost:3001/gerbang-internal-bumdes` (atau domain internal tersembunyi `https://bumdesbanyubeningsuperadmin2025.id/gerbang-internal-bumdes`).

---

## 4. Sistem Otentikasi 2FA Berlapis & Pengelolaan Kredensial

Seluruh akses admin wajib melalui verifikasi 3 tahap berlapis yang ketat:

1. **Tahap 1: Validasi Master Email & Password**
   - Hanya **SATU email** yang diizinkan untuk login, yaitu yang terdaftar pada environment variable `ADMIN_EMAIL` (default: `admin@bumdesbanyubening.id`). Password divalidasi dengan enkripsi `bcrypt` (`ADMIN_PASSWORD_HASH`, default string: `BanyuBening2026!`).
   - Formulir dilindungi oleh tantangan **Cloudflare Turnstile** anti-bot.
2. **Tahap 2: Verifikasi OTP WhatsApp (Fonnte Gateway)**
   - Setelah kredensial email benar, backend otomatis membuat kode angka 6-digit dan mengantrekan pengiriman pesan via **Fonnte API** ke nomor WhatsApp terdaftar (`ADMIN_WA_NUMBER`, default: `081234567890`).
   - OTP memiliki TTL ketat **180 detik (3 menit)** di Redis/cache.
3. **Tahap 3: Validasi PIN 10-Digit (Floating Glassmorphism Numpad)**
   - Setelah verifikasi OTP, pengguna dihadapkan pada antarmuka *floating numpad* bernuansa Air Bening Gunung.
   - Wajib memasukkan **10-Digit PIN Keamanan** (`ADMIN_PIN`, default: `1234567890`).

### Proteksi Rate Limiting & Lockout
- Pengujian gagal 3 kali berturut-turut pada OTP atau PIN dari IP yang sama akan mengunci akses IP tersebut selama **15 menit (900 detik)** menggunakan Upstash/Redis Rate Limiter.

### Pengelolaan Kredensial Tanpa Kode (No-Code)
- Kredensial `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_PIN`, dan `ADMIN_WA_NUMBER` dikelola secara eksklusif dalam environment variables.
- Admin dapat mengganti kredensial melalui panel hosting (**Vercel / Railway Project Settings**) dan perubahan langsung berlaku tanpa perlu deploy ulang kode source (*zero code redeployment*).

---

## 5. Panduan Admin Dashboard Tanpa Coding

Antarmuka Admin Dashboard disediakan dalam bentuk GUI bergaya *glassmorphism* yang elegan, memungkinkan pengelola BUMDes mengatur seluruh konten tanpa menulis kode:

- **Identitas & Latar Belakang (Identity & Visuals)**:
  - Admin dapat merubah Nama BUMDes, Nama Desa, Kontak WhatsApp, dan mengunggah (*upload*) gambar latar belakang pegunungan/mata air dari perangkat lokal melalui tombol **Upload** di dashboard. File diunggah ke server dan URL langsung tersinkron secara *real-time* ke situs publik via Socket.IO.
- **Pengurus (The Floating Leaf)**:
  - Menambah, merubah, atau menghapus profil direksi dan manajer unit usaha dengan role `Direktur`, `Sekretaris 1 & 2`, `Bendahara`, `Manager Jasa`, `Manager Produksi`, `Manager Perdagangan`, atau role kustom, lengkap dengan foto profil sirkular dan bio.
- **Running Text Ticker & Emoji**:
  - Mengatur teks informasi keuangan dan kabar desa dengan pilihan kategori `FINANCIAL` (🟢), `TRAINING` (🟡), dan `BUSINESS` (🔵).

---

## 6. Sistem Program Kerja (Modern Rustic Interactive Showcase)

- **Desain**: Menggunakan palet *Modern Rustic* dengan latar belakang gading/krim (`#FFFDD0` / `#FAF8F5`), teks batu alam (`#4A4A4A`), dan aksen hijau sage (`#87A96B`).
- **Blok Konten Alternatif (Teks & Gambar)**:
  - Admin dapat menyusun daftar blok teks dan gambar dengan urutan bebas.
  - **Auto-Pagination**: Teks panjang secara otomatis dipotong menjadi halaman-halaman pendek di frontend dilengkapi tombol navigasi `◀️ ▶️ Halaman 1 dari 3` dengan efek animasi fade-in.
- **Kontrol Komentar Admin**:
  - Admin memiliki tombol kontrol `Komentar Aktif` / `🔒 Komentar Nonaktif` per program kerja. Jika dimatikan, kolom komentar digantikan dengan pesan peringatan gembok.
- **Komentar & Balasan Threaded bergaya Instagram**:
  - Warga dapat mengisi Nama, Email, dan teks komentar.
  - **Privasi Email**: Email warga **hanya disimpan dalam database untuk dilihat di Admin Dashboard**, dan tidak ditampilkan pada antarmuka publik.
  - **Emoji Picker**: Warga dapat memilih emoji (`❤️`, `👍`, `👏`, `🔥`, `🙌`) dari popup interaktif.
  - **Fitur Balas (Reply)**: Klik tombol "Balas" akan mengisi otomatis *mention tag* `@Email (To leave a comment, you must first login with your email...)` dan menyusun balasan berindensi di bawah komentar induk.

---

## 7. Sistem Integrasi WhatsApp (Fonnte Gateway, WhatsApp Shell Widget, OTP & Live Chat Pengaduan)

Integrasi WhatsApp dikelola melalui layanan **Fonnte API** dengan empat kapabilitas utama:
1. **Pengiriman OTP Verifikasi Admin**:
   - Template resmi: `Kode OTP Anda: XXXXXX. Berlaku 3 menit.`
2. **WhatsApp Shell Chat Widget di Situs Publik (`WhatsAppChatWidget.tsx`)**:
   - Menghadirkan ikon floating WhatsApp di pojok kanan bawah situs publik yang saat diklik membuka antarmuka obrolan **sama persis seperti WhatsApp asli** (warna `#075E54`, latar belakang `#ECE5DD`, gelembung obrolan, dan checkmark ganda `✓✓`), di mana seluruh pemrosesan pesan di belakang layar menggunakan mesin Fonnte BUMDes.
3. **Bot WhatsApp BUMDes**:
   - Memproses perintah warga (`#info`, `#produk`, `#program`, `#help`) dan menjawab informasi secara otomatis tanpa campur tangan admin 24 jam sehari.
4. **Live Chat Pengaduan (WhatsApp Inbox Warga)**:
   - **Webhook Incoming**: Fonnte Webhook (`POST /api/pengaduan/webhook`) menangkap pesan WhatsApp dari nomor warga secara real-time dan menyimpannya di database.
   - **Split Layout Admin UI**:
     - **Panel Kiri**: Daftar nama dan nomor WhatsApp warga yang pernah mengirim pengaduan (dilengkapi badge jumlah pesan belum dibaca).
     - **Panel Kanan**: Gelembung obrolan (*chat bubble*) riwayat percakapan.
   - **Balas Langsung dari Dashboard**: Admin mengetik balasan dan klik tombol Kirim. Backend memanggil Fonnte Send Message API untuk mengirim balasan langsung ke WhatsApp warga, merekam log OUTGOING, dan memperbarui layar secara real-time via **Socket.IO**.

---

## 8. Sistem Tema Liburan Dinamis (No-Code Switching)

Admin dapat mengaktifkan tema liburan secara instan melalui dashboard GUI:
1. **Hari Kemerdekaan RI (Agustus)** — Palet Merah Putih dengan emoji `🇮🇩`, `🦅`, `🔴`, `⚪`.
2. **Ramadan & Idul Fitri** — Nuansa Hijau Zamrud & Emas dengan emoji `🌙`, `🕌`, `🤲`, `🕋`, `⭐`.
3. **Hari Raya Imlek** — Nuansa Merah Emas dengan emoji `🏮`, `🐉`, `🧧`, `🎇`, `🍊`.
4. **Hari Raya Natal** — Nuansa Hijau Cemara & Emas dengan emoji `🎄`, `🎅`, `❄️`, `🔔`, `🕯️`.
5. **Malam Tahun Baru** — Nuansa Kembang Api Malam dengan emoji `🎆`, `🎇`, `🥂`, `🎊`, `🌟`.
6. **Normal** — Nuansa Air Bening Gunung & Hijau Pedesaan (`🟢`, `🟡`, `🔵`).

Ketika tema diaktifkan, event Socket.IO `theme_update` langsung memperbarui estetika situs publik dan menggantikan ikon indikator Running Text dengan emoji liburan secara otomatis.

---

## 9. Sistem Laporan (PDF & Excel) & Log Audit Imutabel

- **Ekspor Excel (.xlsx)**: Admin dapat mengunduh spreadsheet Excel terformat (menggunakan `exceljs`) untuk:
  - Laporan Keuangan & Laba Usaha BUMDes (`/api/reports/financial/excel`)
  - Laporan Realisasi Program Kerja (`/api/reports/program-kerja/excel`)
  - Laporan Log Layanan Pengaduan WhatsApp (`/api/reports/pengaduan/excel`)
  - Laporan Log Audit Imutabel (`/api/reports/audit/excel`)
- **Ekspor PDF & Cetak**: Setiap modul laporan mendukung mode cetak terstruktur untuk diekspor ke PDF via `jspdf` / `html2canvas` / Print Styling.
- **Log Audit Imutabel**:
  - Semua tindakan administratif (`LOGIN_SUCCESS`, `UPDATE_IDENTITY`, `CREATE_PROGRAM_KERJA`, `REPLY_PENGADUAN`, `CREATE_BACKUP`, dll.) direkam ke dalam tabel `AuditLog` dengan cap waktu dan ID admin untuk kepatuhan audit.

---

## 10. Backup & Disaster Recovery (Google Drive Integration)

- **Cron Backup Otomatis**: Penjadwalan `node-cron` otomatis mencadangkan database setiap hari pukul 00:00 UTC ke folder `/backups` dalam format ber-timestamp.
- **Google Drive Cloud Upload**:
  - Jika kredensial service account Google (`GOOGLE_SERVICE_ACCOUNT_EMAIL` & `GOOGLE_PRIVATE_KEY`) serta `GOOGLE_DRIVE_FOLDER_ID` dikonfigurasi di environment variable, arsip backup secara otomatis diunggah ke Google Drive menggunakan **Google Drive API v3**.
- **Panel GUI & Restore**:
  - Admin dapat menekan tombol **Buat Backup Manual Sekarang** di dashboard, mengunduh berkas `.db` / arsip, serta memulihkan (*restore*) database dari riwayat cadangan manapun dengan satu klik.

---

## 11. Panduan Generate Token serta Penggunaannya

Sistem otentikasi memanfaatkan spesifikasi standar **JSON Web Token (JWT)** berganda:
1. **Access Token (TTL: 15 Menit)**:
   - Digunakan untuk mengotentikasi setiap permintaan API administratif.
   - Dikirimkan dalam header HTTP:
     ```http
     Authorization: Bearer <access_token>
     ```
   - Atau secara otomatis melalui **Secure HTTP-Only Cookie** `access_token`.
2. **Refresh Token (TTL: 7 Hari)**:
   - Digunakan untuk memperbarui Access Token yang telah kedaluwarsa tanpa mengharuskan admin mengulang OTP dan PIN.
   - Endpoint perpanjangan: `POST /api/auth/refresh` dengan payload `{ "refreshToken": "<token>" }`.
3. **OTP Session Token (TTL: 5 Menit)**:
   - Token sementara yang diterbitkan oleh endpoint `/gerbang-internal-bumdes/verify-otp` setelah verifikasi OTP WhatsApp berhasil, digunakan untuk otorisasi akses ke Numpad PIN 10-digit.

---

## 12. Penjelasan Lengkap Cara Kerja Deployment (Vercel & VPS/Railway)

Sistem dirancang untuk pemisahan *concern* deployment berskala enterprise:
1. **Deployment Frontend (Next.js - Vercel)**:
   - Situs publik (`public-app/`) dideploy ke project Vercel pada domain publik resmi (misal: `https://bumdesbanyubening.plipir.id`).
   - Admin dashboard (`admin-app/`) dideploy sebagai project Vercel terpisah pada domain rahasia (misal: `https://bumdesbanyubeningsuperadmin2025.id`).
   - Di panel pengaturan Vercel (**Project Settings → Environment Variables**), atur:
     ```env
     NEXT_PUBLIC_API_URL=https://api.bumdesbanyubening.id
     ```
2. **Deployment Backend (Express + Socket.IO - VPS / Railway / Docker)**:
   - Backend Express (`backend/`) dideploy pada instans server yang mendukung *persistent websocket* dan cron job (seperti Railway, AWS EC2, atau VPS Ubuntu).
   - Di panel pengaturan variabel lingkungan server (tanpa redeploy kode), atur:
     ```env
     PORT=4000
     DATABASE_URL="postgresql://user:pass@db.supabase.co:5432/bumdes?schema=public"
     ADMIN_EMAIL="admin@bumdesbanyubening.id"
     ADMIN_PASSWORD_HASH="$2b$10$..."
     ADMIN_PIN="$2b$10$..."
     ADMIN_WA_NUMBER="081234567890"
     FONNTE_TOKEN="token_fonnte_asli"
     GOOGLE_DRIVE_FOLDER_ID="id_folder_drive"
     ```
   - Dengan pemisahan ini, perubahan konfigurasi dan kredensial cukup dilakukan di Vercel atau Railway panel dan langsung aktif seketika.

---

## 13. Pengujian Otomatis (Test Suite)

Repositori dilengkapi dengan Test Suite komprehensif menggunakan **Vitest** & **Supertest** yang memvalidasi seluruh kontrak eksekusi:

```bash
npm test
```

### Ruang Lingkup Pengujian (`backend/tests/api.test.ts`):
1. `GET /health` memastikan status sistem OK dan database terhubung.
2. Otentikasi 2FA Tahap 1 (`login-email`) memverifikasi master email dan verifikasi anti-bot.
3. Otentikasi 2FA Tahap 2 (`verify-otp`) memvalidasi OTP angka 6-digit dan menerbitkan `otpSessionToken`.
4. Otentikasi 2FA Tahap 3 (`verify-pin`) memvalidasi PIN 10-digit dan menerbitkan Access & Refresh token JWT.
5. `GET /api/identity` memastikan data BUMDes Banyubening konsisten.
6. `PUT /api/theme/activate` memverifikasi peralihan tema liburan dinamis (`KEMERDEKAAN`).
7. `GET /api/program-kerja` memastikan susunan blok teks dan gambar alternatif.
8. `POST /api/program-kerja/:id/comments` memverifikasi pengiriman komentar bergaya Instagram dan **proteksi privasi email warga pada API publik vs Admin**.
9. `POST /api/pengaduan/webhook` memvalidasi tangkapan webhook pesan WhatsApp dari Fonnte serta perintah bot `#info`.
10. `GET /api/pengaduan/conversations` memverifikasi struktur *split layout* chat admin.
11. `GET /api/reports/financial/excel` memverifikasi ekspor laporan format spreadsheet Excel (`.xlsx`).
12. `POST /api/backup/manual` memvalidasi pembuatan arsip cadangan database manual.
13. `GET /api/audit` memverifikasi pencatatan jejak audit imutabel.
14. `GET /api/search` memverifikasi pencarian terintegrasi untuk artikel, produk, dan program kerja.

---

## 14. Daftar Lengkap Berkas Dokumentasi Teknis (`docs/`)

Untuk petunjuk teknis mendalam per modul, silakan merujuk pada perpustakaan berkas dokumentasi resmi di folder `docs/`:

| Nama Berkas | Topik Panduan & Penjelasan Teknis |
| :--- | :--- |
| **`docs/ARSITEKTUR_DAN_PANDUAN.md`** | Diagram ASCII arsitektur sistem monorepo, alur integrasi klien-server, dan alur kerja pemrosesan pesan WhatsApp. |
| **`docs/1_INSTALASI_DAN_SETUP.md`** | Panduan lengkap spesifikasi lingkungan (*Node.js, NPM, Supabase, SQLite, Redis*), prosedur instalasi dari nol, pengisian `.env`, sinkronisasi skema Prisma, dan *seeder*. |
| **`docs/2_PANDUAN_ADMIN_DASHBOARD.md`** | Panduan pengoperasian *No-Code Admin Dashboard* untuk mengelola Identitas (nama, logo, favicon), merubah Latar Belakang Alam Desa (*Hero Background Upload*), struktur Pengurus **The Floating Leaf**, Running Text Ticker, serta cara admin merubah kredensial lewat *environment variables* tanpa coding. |
| **`docs/3_PROGRAM_KERJA_DAN_KOMENTAR.md`** | Panduan pengelolaan blok konten alternatif (teks & gambar), mekanisme **Auto-Pagination Halaman 1-3** di frontend, tombol kontrol aktif/nonaktif komentar Admin (*Comment Toggle*), moderasi komentar, emoji picker, serta **kebijakan privasi alamat email warga**. |
| **`docs/4_INTEGRASI_WHATSAPP_FONNTE.md`** | Panduan lengkap integrasi Fonnte Gateway: pengiriman OTP keamanan admin, **WhatsApp Bot Command Handler** (`#info`, `#produk`, `#program`, `#help`), webhook pesan masuk pengaduan warga, serta tata cara membalas pesan langsung ke WhatsApp warga melalui antarmuka **Split Layout** di Admin Dashboard. |
| **`docs/5_BACKUP_DAN_DISASTER_RECOVERY.md`** | Panduan sistem *cron backup* otomatis harian (`node-cron`), pembuatan cadangan manual, unduh arsip `.db`, pemulihan database (*restore*), dan integrasi cloud backup ke folder Google Drive. |
| **`docs/6_DEPLOYMENT_VERCEL_DAN_VPS.md`** | Penjelasan mendalam cara kerja *decoupled deployment* situs publik dan admin dashboard di **Vercel** (menggunakan project terpisah dan domain rahasia), deployment backend Express.js + Socket.IO di **VPS/Railway**, pengelolaan variabel lingkungan di Vercel Project Settings tanpa redeploy kode, serta perlindungan dari mesin pencari (`robots.txt`). |
| **`docs/7_PANDUAN_TOKEN_DAN_KEAMANAN_2FA.md`** | Panduan siklus token JWT (Access Token 15m, Refresh Token 7d, OTP Session Token 5m), spesifikasi enkripsi `bcryptjs`, Turnstile anti-bot, serta panduan pengujian API dengan cURL / Postman menggunakan header `Authorization: Bearer <token>`. |
| **`docs/8_PANDUAN_LENGKAP_ENV_GOOGLE_DRIVE_REDIS.md`** | Panduan lengkap konfigurasi seluruh variabel pada `.env`, langkah-demi-langkah setup **Google Drive API v3 Service Account** di Google Cloud Console (hingga mendapatkan `GOOGLE_PRIVATE_KEY` dan `GOOGLE_DRIVE_FOLDER_ID`), serta panduan pembuatan database **Upstash Redis Cloud URL**. |
| **`docs/9_PANDUAN_LENGKAP_FONNTE_WHATSAPP.md`** | Panduan registrasi akun di Fonnte (`https://fonnte.com`), cara scan QR Code WhatsApp BUMDes, mendapatkan `FONNTE_TOKEN`, mengatur endpoint **Fonnte Webhook URL** (`/api/pengaduan/webhook`), spesifikasi perintah bot `#info`, `#produk`, `#program`, serta pemecahan masalah. |
| **`docs/MASTER_PROMPT_BUMDES_BANYUBENING.md`** | Berkas **Master Prompt & Blueprint Spesifikasi Arsitektur Lengkap** dalam satu dokumen Markdown yang merangkum seluruh standar engineering, kontrak eksekusi, otentikasi 2FA, antarmuka pedesaan Glassmorphism, dan alur sistem platform BUMDes Banyubening 2026. |
| **`docs/BUMDes_Banyubening_Postman_Collection.json`** | Berkas standar **Postman API Collection** berstruktur lengkap yang siap diimpor ke Postman untuk pengujian 14+ endpoint otentikasi 2FA, CRUD internal, Fonnte Webhook, dan ekspor laporan. |

---
*Dibuat oleh Autonomous Senior Principal Fullstack Engineering System untuk BUMDes Banyubening 2026.*
