# 8. Panduan Lengkap Konfigurasi `.env` (Setup Google Drive API v3 & Redis URL)

Dokumen ini adalah panduan mendalam dan praktis mengenai seluruh variabel lingkungan (*environment variables*) yang digunakan dalam sistem BUMDes Banyubening, khususnya instruksi langkah-demi-langkah cara mendapatkan dan mengatur kredensial **Google Drive API v3** untuk *Disaster Recovery Cloud Backup* serta konfigurasi **Redis URL** untuk sistem antrean dan *caching*.

---

## A. Referensi Lengkap Seluruh Variabel Lingkungan (`.env`)

Berikut adalah daftar lengkap seluruh variabel lingkungan beserta deskripsi, nilai default (lokal), dan aturan pengisian untuk produksi:

```env
# -----------------------------------------------------------------------------
# 1. KONFIGURASI PORT & URL SERVER
# -----------------------------------------------------------------------------
PORT=4000
NODE_ENV=development
PUBLIC_APP_URL=http://localhost:3000
ADMIN_APP_URL=http://localhost:3001
API_URL=http://localhost:4000

# -----------------------------------------------------------------------------
# 2. KONFIGURASI DATABASE
# -----------------------------------------------------------------------------
# Produksi: Gunakan koneksi PostgreSQL Supabase ber-pool (atau Direct URL)
# Contoh Supabase: "postgresql://postgres:[PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres?schema=public"
# Pengembangan Lokal: Gunakan SQLite (dev.db) agar langsung siap pakai tanpa konfigurasi eksternal
DATABASE_URL="file:../dev.db"

# -----------------------------------------------------------------------------
# 3. PRISMA OFFLINE-SAFE ENGINE PATHS
# -----------------------------------------------------------------------------
# Konfigurasi defensif ini menjamin Prisma berjalan 100% offline tanpa mengunduh binari eksternal
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
PRISMA_SCHEMA_ENGINE_BINARY="/home/user/BUMDes-BANYUBENING/backend/prisma/engines/schema-engine"
PRISMA_QUERY_ENGINE_LIBRARY="/home/user/BUMDes-BANYUBENING/backend/prisma/engines/libquery_engine.so.node"
PRISMA_QUERY_ENGINE_BINARY="/home/user/BUMDes-BANYUBENING/backend/prisma/engines/query-engine"

# -----------------------------------------------------------------------------
# 4. KREDENSIAL MASTER ADMIN (2FA LAYERED)
# -----------------------------------------------------------------------------
# Hanya SATU email yang diizinkan untuk login Admin. Email lain akan ditolak sistem.
ADMIN_EMAIL="admin@bumdesbanyubening.id"
# Hash bcrypt (Salt 10) atau string biasa untuk pengembangan lokal
ADMIN_PASSWORD_HASH="BanyuBening2026!"
# PIN Keamanan 10-Digit (wajib 10 angka) untuk Numpad Glassmorphism
ADMIN_PIN="1234567890"
# Nomor WhatsApp resmi Admin BUMDes penerima 6-Digit OTP login
ADMIN_WA_NUMBER="081234567890"

# -----------------------------------------------------------------------------
# 5. TOKEN KEAMANAN JWT (JSON WEB TOKEN)
# -----------------------------------------------------------------------------
JWT_ACCESS_SECRET="bumdes_banyubening_access_secret_enterprise_key_2026_super_secure"
JWT_REFRESH_SECRET="bumdes_banyubening_refresh_secret_enterprise_key_2026_super_secure"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# -----------------------------------------------------------------------------
# 6. WHATSAPP BOT & FONNTE GATEWAY INTEGRATION
# -----------------------------------------------------------------------------
FONNTE_TOKEN="demo_fonnte_token_bumdes_banyubening"
FONNTE_API_URL="https://api.fonnte.com/send"
FONNTE_WEBHOOK_SECRET="bumdes_fonnte_webhook_secret_2026"

# -----------------------------------------------------------------------------
# 7. CACHE & QUEUE (REDIS URL / IN-MEMORY FALLBACK)
# -----------------------------------------------------------------------------
REDIS_URL="redis://localhost:6379"

# -----------------------------------------------------------------------------
# 8. GOOGLE DRIVE BACKUP & DISASTER RECOVERY (API v3 SERVICE ACCOUNT)
# -----------------------------------------------------------------------------
GOOGLE_DRIVE_FOLDER_ID="1BUMDesBanyubeningBackupFolderIdExample2026"
GOOGLE_SERVICE_ACCOUNT_EMAIL="backup-service@bumdes-banyubening.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"

# -----------------------------------------------------------------------------
# 9. PROTEKSI CLOUDFLARE TURNSTILE ANTI-BOT
# -----------------------------------------------------------------------------
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
```

---

## B. Panduan Langkah demi Langkah Setup Google Drive API v3 (Cloud Backup)

Sistem BUMDes Banyubening memiliki modul *Disaster Recovery* yang dapat mengunggah arsip cadangan database harian secara otomatis ke Google Drive menggunakan otentikasi **Service Account (JWT Auth)**.

### Langkah 1: Buat Proyek Baru di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Login menggunakan akun Google / Gmail administrasi BUMDes.
3. Klik dropdown **Select a project** di pojok kiri atas, lalu klik **New Project**.
4. Beri nama proyek: `BUMDes-Banyubening-Backup` dan klik **Create**.

### Langkah 2: Aktifkan Google Drive API
1. Pada menu navigasi kiri Google Cloud Console, pilih **APIs & Services → Library**.
2. Di kolom pencarian, ketik: **Google Drive API**.
3. Klik hasil **Google Drive API**, lalu klik tombol biru **ENABLE** (Aktifkan).

### Langkah 3: Buat Service Account (Akun Layanan)
1. Pilih menu **APIs & Services → Credentials**.
2. Klik tombol **+ CREATE CREDENTIALS** di bagian atas, lalu pilih **Service account**.
3. Isi formulir pembuatan akun layanan:
   - **Service account name**: `backup-service-bumdes`
   - **Service account ID**: `backup-service-bumdes` (otomatis terisi)
   - **Description**: `Service account untuk cadangan otomatis database BUMDes Banyubening`
4. Klik **CREATE AND CONTINUE**, lalu klik **DONE** (lewatkan pemberian role proyek karena kita akan membagikan folder secara spesifik).

### Langkah 4: Buat & Unduh Private Key berformat JSON
1. Di halaman **Credentials**, klik nama Service Account yang baru dibuat (berakhiran `@<id-project>.iam.gserviceaccount.com`).
2. Buka tab **KEYS** di bagian atas.
3. Klik **ADD KEY → Create new key**.
4. Pilih tipe kunci **JSON**, lalu klik **CREATE**.
5. Berkas `.json` akan otomatis terunduh ke komputer Anda. Buka berkas tersebut menggunakan teks editor.

### Langkah 5: Salin Kredensial ke dalam Berkas `.env`
Di dalam berkas JSON yang diunduh, Anda akan menemukan dua atribut penting:
- `client_email`: Alamat email Service Account (contoh: `backup-service-bumdes@project-id.iam.gserviceaccount.com`).
- `private_key`: Kunci privat RSA yang diawali `-----BEGIN PRIVATE KEY-----` dan diakhiri `-----END PRIVATE KEY-----\n`.

Salin ke `.env`:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL="backup-service-bumdes@project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkrg... (salin seluruh isi string private_key dari berkas JSON, pastikan karakter \n tetap ada) ...\n-----END PRIVATE KEY-----\n"
```

### Langkah 6: Siapkan Folder Google Drive & Berikan Akses Editor
1. Buka [Google Drive](https://drive.google.com/) menggunakan browser Anda.
2. Buat folder baru dengan nama: **BACKUP_DATABASE_BUMDES_BANYUBENING**.
3. Klik kanan pada folder tersebut → pilih **Share (Bagikan)**.
4. Pada kolom **Add people and groups**, masukkan alamat email Service Account (`GOOGLE_SERVICE_ACCOUNT_EMAIL` yang Anda dapatkan di Langkah 5).
5. Atur peran (*role*) sebagai **Editor**, hapus centang *Notify people*, lalu klik **Share**.

### Langkah 7: Dapatkan `GOOGLE_DRIVE_FOLDER_ID`
1. Buka folder **BACKUP_DATABASE_BUMDES_BANYUBENING** yang baru Anda buat di Google Drive.
2. Perhatikan URL di bilah alamat browser Anda:  
   `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j-XYZ123456789`
3. Kode acak setelah `/folders/` adalah **Folder ID**. Salin kode tersebut dan masukkan ke dalam `.env`:
   ```env
   GOOGLE_DRIVE_FOLDER_ID="1a2b3c4d5e6f7g8h9i0j-XYZ123456789"
   ```

### Langkah 8: Verifikasi Pengujian dari Admin Dashboard
- Setelah `.env` tersimpan, restart server Express backend (`npm run dev:backend`).
- Buka antarmuka Admin Dashboard pada tab menu **Backup & Google Drive**.
- Klik tombol **Buat Backup Manual Sekarang**.
- Jika sukses, log server akan menampilkan:  
  `[INFO]: Backup successfully uploaded to Google Drive (driveFileId: ...)` dan berkas `.db` akan muncul di dalam folder Google Drive Anda!

---

## C. Panduan Lengkap Konfigurasi Redis URL (Cache & Queue System)

Sistem BUMDes Banyubening memanfaatkan Redis untuk tiga fungsi krusial:
1. **Penyimpanan Kode OTP 2FA** dengan masa berlaku ketat 180 detik (3 menit).
2. **Rate Limiting & IP Lockout** untuk mengunci IP yang gagal login 3 kali berturut-turut selama 15 menit.
3. **Antrean Pesan WhatsApp (`wa_message_queue`)** yang diproses secara FIFO oleh pekerja latar belakang Fonnte Gateway.

### 1. Format String Koneksi `REDIS_URL`
Format standar URI untuk koneksi Redis:
```env
# Format: redis://[username]:[password]@[host]:[port]
REDIS_URL="redis://localhost:6379"
```

### 2. Pilihan 1: Menjalankan Redis Lokal (Linux / Ubuntu / macOS)
Jika Anda meng-host backend pada VPS Ubuntu atau menjalankan di komputer lokal yang terpasang Redis:
```bash
# Instalasi Redis di Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y redis-server

# Aktifkan service Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```
Konfigurasi `.env`:
```env
REDIS_URL="redis://127.0.0.1:6379"
```

### 3. Pilihan 2: Menggunakan Cloud Redis (Upstash / Redis Cloud) - Sangat Direkomendasikan
Untuk deployment produksi berarsitektur *serverless* atau cloud VPS tanpa membebani RAM server:
1. Daftar akun gratis di [Upstash Redis](https://upstash.com/).
2. Buat database baru: klik **Create Database** → beri nama `bumdes-banyubening-redis` → pilih *Region* terdekat (misal: Singapore / `ap-southeast-1`).
3. Setelah database aktif, gulir ke bagian **Connect to your database**.
4. Salin string koneksi **Redis URL** (berawalan `redis://default:xxxxxx@yyy.upstash.io:6379`).
5. Tempelkan ke berkas `.env` Anda:
   ```env
   REDIS_URL="redis://default:abc123xxxxxx@singapore-redis.upstash.io:6379"
   ```

### 4. Fitur Unggulan: Enterprise In-Memory Cache Fallback (Zero-Downtime Guarantee)
Sistem BUMDes Banyubening dilengkapi proteksi **Defensive In-Memory Fallback** pada berkas `backend/src/shared/redis/cache.ts`:
- Jika server Redis lokal maupun cloud mengalami kendala koneksi atau Anda menjalankan aplikasi tanpa menginstal Redis sekalipun, sistem **TIDAK AKAN CRASH**.
- Backend secara otomatis beralih ke *Enterprise In-Memory Map Store* yang memiliki dukungan penuh terhadap operasi `get`, `set` (ber-TTL), `del`, `lpush`, `rpop`, dan `keys`.
- Seluruh fungsi OTP 3 menit, IP Lockout, dan WhatsApp Bot Queue tetap berfungsi normal tanpa kendala.
