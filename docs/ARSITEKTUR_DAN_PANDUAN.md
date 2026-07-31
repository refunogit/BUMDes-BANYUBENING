# Dokumentasi Arsitektur Enterprise BUMDes Banyubening

Dokumen ini menjelaskan diagram arsitektur teknis dan alur integrasi antar-komponen dalam sistem BUMDes Banyubening.

---

## 1. Diagram Arsitektur Sistem

```
                 +-------------------------------------------------------------+
                 |                     WARGA DESA & PUBLIK                     |
                 +-------------------------------------------------------------+
                                      |                    ^
                                      | HTTP GET           | Realtime Socket.IO
                                      v                    | (content_update)
                 +-----------------------------------------+-------------------+
                 |                  PUBLIC WEBSITE (Port 3000)                 |
                 |      https://bumdesbanyubening.plipir.id (Read-Only)      |
                 |  [Clock Embun] [Ticker] [Showcase] [Shopee UX] [Pengurus]   |
                 +-------------------------------------------------------------+
                                      ^                    ^
                                      | REST API           | Socket.IO
                                      v                    |
+------------------------------------------------------------------------------+
|                     BACKEND EXPRESS.JS API (Port 4000)                       |
|   +----------------------------------------------------------------------+   |
|   | ROUTE -> CONTROLLER -> SERVICE -> REPOSITORY -> PRISMA ORM -> DATABASE|  |
|   +----------------------------------------------------------------------+   |
|   | MODUL: Auth, Identity, Theme, ProgramKerja, Products, Pengurus,       |  |
|   |        RunningText, Articles, UnitUsaha, Pengaduan, Reports, Backup  |   |
|   +----------------------------------------------------------------------+   |
+------------------------------------------------------------------------------+
           ^                ^               ^                       ^
           |                |               |                       |
           v                v               v                       v
+------------------+  +-----------+  +--------------+   +----------------------+
| DATABASE SUPABASE|  | REDIS/MEM |  | FONNTE GATEWAY|  |  GOOGLE DRIVE API v3 |
|  PostgreSQL /    |  |  Cache &  |  |  WhatsApp Bot|  |   Cloud Backup      |
|  SQLite fallback |  |   Queue   |  |   & Webhook  |  |   Folder Storage    |
+------------------+  +-----------+  +--------------+   +----------------------+
                                            ^                       ^
                                            |                       |
                 +--------------------------+-----------------------+----------+
                 |              ADMIN DASHBOARD (Port 3001)                    |
                 |   https://bumdesbanyubeningsuperadmin2025.id (Unlisted)     |
                 |       Route: /gerbang-internal-bumdes (2FA Layered)         |
                 +-------------------------------------------------------------+
```

---

## 2. Alur Otentikasi 2FA Berlapis

```
[Admin Mengakses /gerbang-internal-bumdes]
               |
               v
   (Tahap 1: Validasi Email & Password)
   - Email dicocokkan dengan process.env.ADMIN_EMAIL
   - Turnstile / reCAPTCHA diverifikasi
   - Jika OK -> Backend kirim 6-Digit OTP via Fonnte API ke ADMIN_WA_NUMBER
               |
               v
   (Tahap 2: Input 6-Digit OTP WhatsApp)
   - Timer 180 detik (3 menit) di Redis/Cache
   - Jika OK -> Backend terbitkan otpSessionToken (TTL 5 menit)
               |
               v
   (Tahap 3: Input 10-Digit PIN di Glassmorphism Numpad)
   - PIN dicocokkan dengan process.env.ADMIN_PIN
   - Jika OK -> Backend terbitkan Access Token JWT (15m) & Refresh Token (7d)
   - Redirect ke /dashboard
```

---

## 3. Alur Fonnte WhatsApp Live Chat Pengaduan & Bot Command Handler

```
[Warga Mengirim WA ke Nomor BUMDes]
               |
               v
   (Fonnte Gateway menerima pesan)
               |
               v
   (POST /api/pengaduan/webhook di Backend BUMDes)
               |
        +------+------+
        |             |
        v             v
  (Pesan #info,    (Pesan biasa / pengaduan)
   #produk, atau    - Simpan pesan INCOMING ke tabel PengaduanMessage
   #program)        - Terbitkan event Socket.IO 'new_pengaduan_message'
        |                     |
        v                     v
  (Bot membalas      (Admin Dashboard Panel Kiri memperbarui daftar warga)
   otomatis via       - Admin klik nama warga -> Panel Kanan muat riwayat obrolan
   Fonnte API)        - Admin ketik balasan -> Klik Kirim -> dikirim via Fonnte API
```

---

## 4. Daftar Panduan Teknis Lengkap di Folder `docs/`

| Nama Berkas | Topik Panduan |
| :--- | :--- |
| `docs/ARSITEKTUR_DAN_PANDUAN.md` | Diagram arsitektur monorepo & alur integrasi sistem. |
| `docs/1_INSTALASI_DAN_SETUP.md` | Panduan instalasi dari nol, pengisian `.env`, dan seeding database. |
| `docs/2_PANDUAN_ADMIN_DASHBOARD.md` | Panduan No-Code Admin Dashboard (Identitas, Pengurus, Latar, Kredensial). |
| `docs/3_PROGRAM_KERJA_DAN_KOMENTAR.md` | Panduan blok teks/gambar, auto-pagination, comment toggle, & privasi email. |
| `docs/4_INTEGRASI_WHATSAPP_FONNTE.md` | Panduan WhatsApp Bot, webhook pengaduan, dan split layout live chat. |
| `docs/5_BACKUP_DAN_DISASTER_RECOVERY.md` | Panduan cron backup harian, manual backup, dan restore database. |
| `docs/6_DEPLOYMENT_VERCEL_DAN_VPS.md` | Panduan deployment Next.js di Vercel & Express di VPS/Railway. |
| `docs/7_PANDUAN_TOKEN_DAN_KEAMANAN_2FA.md` | Panduan token JWT, otentikasi 2FA, enkripsi bcryptjs, & cURL testing. |
| `docs/8_PANDUAN_LENGKAP_ENV_GOOGLE_DRIVE_REDIS.md` | Panduan `.env` lengkap, setup Google Drive API v3 Service Account, & Redis URL. |
| `docs/9_PANDUAN_LENGKAP_FONNTE_WHATSAPP.md` | Panduan daftar Fonnte, scan QR WhatsApp, setup Webhook URL, & bot commands. |
| `docs/MASTER_PROMPT_BUMDES_BANYUBENING.md` | Master Prompt & Spesifikasi Arsitektur Lengkap BUMDes Banyubening. |
| `docs/BUMDes_Banyubening_Postman_Collection.json` | Berkas siap pakai **Postman API Collection** berstruktur lengkap (14+ endpoints). |

---
*Dokumentasi Arsitektur Teknis BUMDes Banyubening 2026.*
