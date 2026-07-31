# 6. Panduan Lengkap Deployment (Vercel & VPS/Railway)

Sistem BUMDes Banyubening memisahkan secara fisik (*decoupled architecture*) antara lapisan antarmuka publik, antarmuka kontrol Admin, dan layanan backend API guna menjamin keandalan berskala enterprise serta kemudahan konfigurasi tanpa perlu melakukan kompilasi ulang kode (*zero code redeployment*).

---

## A. Arsitektur Infrastruktur Deployment

```
+-------------------------------------------------------------------------+
|                        VERCEL CLOUD PLATFORM                            |
|                                                                         |
|  +---------------------------------+  +------------------------------+  |
|  |           PUBLIC APP            |  |          ADMIN APP           |  |
|  |       Next.js App Router        |  |      Next.js App Router      |  |
|  |  bumdesbanyubening.plipir.id    |  |  bumdesbanyubeningsuperadmin |  |
|  +---------------------------------+  +------------------------------+  |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP REST API & Socket.IO
                                     v
+-------------------------------------------------------------------------+
|                  RAILWAY / VPS SERVER (Ubuntu Linux)                    |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                    BACKEND EXPRESS.JS + SOCKET.IO                 |  |
|  |                           (Port 4000/80)                          |  |
|  +---------------------------------+---------------------------------+  |
|                                    |                                    |
|         +--------------------------+--------------------------+         |
|         |                          |                          |         |
|         v                          v                          v         |
|  +--------------+          +---------------+          +--------------+  |
|  |   SUPABASE   |          |  UPSTASH/REDIS|          | FONNTE & GDR |  |
|  |  PostgreSQL  |          | Cache & Queue |          |  Integrations|  |
|  +--------------+          +---------------+          +--------------+  |
+-------------------------------------------------------------------------+
```

---

## B. Deployment Frontend Next.js di Vercel

### 1. Deployment Situs Publik (`public-app/`)
1. Hubungkan repositori Git ke **Vercel Dashboard**.
2. Buat Project baru untuk Situs Publik. Set Root Directory ke `public-app`.
3. Buka **Project Settings → Environment Variables**, lalu tambahkan:
   ```env
   NEXT_PUBLIC_API_URL=https://api.bumdesbanyubening.id
   ```
4. Klik **Deploy**. Pasang domain publik resmi BUMDes (misal: `bumdesbanyubening.plipir.id`).

### 2. Deployment Admin Dashboard (`admin-app/`)
1. Buat Project Vercel kedua untuk Admin Dashboard. Set Root Directory ke `admin-app`.
2. Buka **Project Settings → Environment Variables**, lalu tambahkan:
   ```env
   NEXT_PUBLIC_API_URL=https://api.bumdesbanyubening.id
   NEXT_PUBLIC_PUBLIC_APP_URL=https://bumdesbanyubening.plipir.id
   ```
3. Klik **Deploy**. Pasang domain tersembunyi yang tidak dipublikasikan (misal: `bumdesbanyubeningsuperadmin2025.id`).
4. **Proteksi Mesin Pencari**: Verifikasi bahwa berkas `robots.txt` pada root domain mengembalikan `Disallow: /` dan header respons mengandung `X-Robots-Tag: noindex, nofollow`.

---

## C. Deployment Backend Express.js di VPS / Railway

Backend membutuhkan *long-lived connection* untuk Socket.IO serta *cron job* latar belakang, sehingga ideal di-host pada layanan VPS Linux (Ubuntu), Railway, atau AWS ECS.

### 1. Pengaturan Variabel Lingkungan Server (Tanpa Coding)
Di panel pengaturan variabel lingkungan hosting (misal: Railway Project Variables atau berkas `/etc/systemd/system/bumdes-backend.env` di VPS), masukkan:

```env
PORT=4000
NODE_ENV=production
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/bumdes?schema=public"

# Kredensial 2FA Master Admin
ADMIN_EMAIL="admin@bumdesbanyubening.id"
ADMIN_PASSWORD_HASH="$2b$10$YourHashedPasswordHere"
ADMIN_PIN="$2b$10$YourHashed10DigitPinHere"
ADMIN_WA_NUMBER="081234567890"

# Token Keamanan & Integrasi
JWT_ACCESS_SECRET="rahasia_jwt_access_enterprise_bumdes_2026"
JWT_REFRESH_SECRET="rahasia_jwt_refresh_enterprise_bumdes_2026"
FONNTE_TOKEN="token_fonnte_asli_dari_dashboard"
FONNTE_API_URL="https://api.fonnte.com/send"
REDIS_URL="redis://default:password@redis.upstash.io:6379"

# Google Drive API
GOOGLE_DRIVE_FOLDER_ID="id_folder_gdrive_bumdes"
GOOGLE_SERVICE_ACCOUNT_EMAIL="service@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 2. Mengganti Kredensial & Tema Tanpa Redeploy Kode
- Jika Admin ingin merubah nomor WhatsApp OTP (`ADMIN_WA_NUMBER`) atau merubah PIN keamanan (`ADMIN_PIN`), cukup ubah nilainya pada panel Environment Variables di hosting (Railway/VPS), lalu tekan **Restart Service**.
- Sistem otomatis membaca nilai baru tanpa melakukan git commit atau build ulang.

---

## D. Pengamanan Rute & CORS Enterprise
- **CORS Middleware**: Backend dikonfigurasi untuk menerima kredensial otentikasi (`credentials: true`) dari domain yang diizinkan.
- **Obfuscated Route**: Seluruh rute otentikasi dipasang pada `/gerbang-internal-bumdes` untuk mencegah upaya pemindaian (*automated scanning*) oleh peretas.
