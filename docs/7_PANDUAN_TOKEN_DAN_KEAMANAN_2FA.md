# 7. Panduan Token Keamanan (JWT), Enkripsi Bcrypt, & Otentikasi 2FA

Dokumen ini memaparkan spesifikasi teknis sistem otentikasi berlapis ganda, siklus masa pakai token (**JSON Web Token / JWT**), enkripsi **bcryptjs**, perlindungan dari serangan otomatis, serta cara menggunakan token untuk pengujian API.

---

## A. Jenis Token dalam Sistem BUMDes Banyubening

```
+-----------------------------------------------------------------------------+
|                      SIKLUS MASA PAKAI TOKEN SISTEM                         |
+-----------------------------------------------------------------------------+
|  1. OTP Session Token  -> TTL 5 Menit  (Hanya untuk akses Numpad PIN)       |
|  2. Access Token JWT   -> TTL 15 Menit (Otorisasi API CRUD Admin BUMDes)    |
|  3. Refresh Token JWT  -> TTL 7 Hari   (Perpanjangan Access Token otomatis) |
+-----------------------------------------------------------------------------+
```

### 1. OTP Session Token (TTL: 5 Menit)
- Diterbitkan oleh endpoint `POST /gerbang-internal-bumdes/verify-otp` setelah admin berhasil memasukkan kode 6-digit WhatsApp OTP dari Fonnte.
- Berisi payload `{ email: "admin@bumdesbanyubening.id", step: "PIN_REQUIRED" }`.
- Digunakan secara eksklusif sebagai bukti otorisasi untuk membuka tahap ke-3 (input Numpad 10-Digit PIN).

### 2. Access Token JWT (TTL: 15 Menit)
- Diterbitkan oleh endpoint `POST /gerbang-internal-bumdes/verify-pin` setelah PIN 10-digit terverifikasi.
- Berisi payload identitas utama Admin:
  ```json
  {
    "id": "master-admin-bumdes-id",
    "email": "admin@bumdesbanyubening.id",
    "role": "SUPER_ADMIN",
    "iat": 1785322800,
    "exp": 1785323700
  }
  ```
- Wajib disertakan pada setiap permintaan HTTP ke endpoint administratif (`PUT /api/identity`, `POST /api/program-kerja`, `GET /api/audit`, dll.) melalui:
  - Header HTTP: `Authorization: Bearer <access_token>`
  - Atau secara otomatis melalui HTTP-Only Cookie `access_token`.

### 3. Refresh Token JWT (TTL: 7 Hari)
- Diterbitkan bersamaan dengan Access Token.
- Digunakan untuk memperoleh Access Token baru melalui `POST /api/auth/refresh` tanpa mengharuskan admin mengulang OTP WhatsApp atau PIN selama 7 hari masa sesi aktif.

---

## B. Pengujian API Menggunakan Token (cURL & Postman)

### 1. Cara Mendapatkan Access Token (Simulasi 3 Tahap)
```bash
# Tahap 1: Login Email & Password
curl -X POST http://localhost:4000/gerbang-internal-bumdes/login-email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bumdesbanyubening.id","password":"BanyuBening2026!"}'

# Tahap 2: Verifikasi OTP WhatsApp (Gunakan devOtp yang didapat pada dev mode)
curl -X POST http://localhost:4000/gerbang-internal-bumdes/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bumdesbanyubening.id","otpCode":"123456"}'

# Tahap 3: Verifikasi 10-Digit PIN Numpad (Gunakan otpSessionToken dari Tahap 2)
curl -X POST http://localhost:4000/gerbang-internal-bumdes/verify-pin \
  -H "Content-Type: application/json" \
  -d '{"otpSessionToken":"<OTP_SESSION_TOKEN>","pin":"1234567890"}'
```

### 2. Cara Menggunakan Access Token untuk Memanggil API Admin
Setelah mendapatkan `accessToken`, gunakan pada header `Authorization`:

```bash
# Contoh: Merubah nama dan alamat BUMDes
curl -X PUT http://localhost:4000/api/identity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"name":"BUMDes Banyubening Maju","phone":"081234567890"}'
```

---

## C. Spesifikasi Enkripsi `bcryptjs` & Keamanan Anti-Bot

- **Enkripsi Kata Sandi & PIN**: Semua kata sandi (`ADMIN_PASSWORD_HASH`) dan PIN (`ADMIN_PIN`) yang diset di variabel lingkungan atau tabel `AdminUser` di-hash dengan standar `bcryptjs` (salt rounds = 10).
- **Fallback String Compare (Hanya di Tes/Dev)**: Sebagai kemudahan pengujian otomatis (*test suite*), jika variabel lingkungan diisi dengan string biasa yang tidak diawali karakter `$2a$` / `$2b$`, fungsi pengecekan mendukung verifikasi string langsung secara aman tanpa merusak kompatibilitas hash produksi.
- **Proteksi Cloudflare Turnstile / reCAPTCHA v3**: Formulir login dikonfigurasi untuk memverifikasi token pengaman anti-bot ke server Cloudflare (`https://challenges.cloudflare.com/turnstile/v0/siteverify`).
