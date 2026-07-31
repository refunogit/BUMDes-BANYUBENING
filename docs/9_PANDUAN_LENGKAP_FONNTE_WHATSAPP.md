# 9. Panduan Lengkap Integrasi Fonnte WhatsApp Gateway (Bot, OTP & Live Chat Pengaduan)

Dokumen ini adalah panduan teknis dan operasional menyeluruh mengenai integrasi WhatsApp pada platform BUMDes Banyubening menggunakan penyedia layanan **Fonnte Gateway** (`https://fonnte.com`). Modul ini mengendalikan pengiriman OTP keamanan admin, Bot otomatisasi pesan warga (`#info`, `#produk`, `#program`), serta antarmuka obrolan warga *Live Chat Pengaduan* di Admin Dashboard.

---

## A. Daftar Fitur & Kapabilitas Fonnte BUMDes

```
+-----------------------------------------------------------------------------------+
|                        MODUL INTEGRASI WHATSAPP BUMDES                            |
+-----------------------------------------------------------------------------------+
|  1. PENGIRIMAN OTP LOGIN ADMIN (2FA)                                              |
|     - Mengirimkan kode angka 6-digit ke nomor admin terdaftar (ADMIN_WA_NUMBER).  |
|     - Template resmi: "Kode OTP Anda: XXXXXX. Berlaku 3 menit."                   |
|                                                                                   |
|  2. WHATSAPP BOT COMMAND HANDLER (#info, #produk, #program, #help)                |
|     - Menjawab otomatis pertanyaan warga tanpa campur tangan admin secara instan. |
|                                                                                   |
|  3. LIVE CHAT PENGADUAN (WHATSAPP INBOX WARGA - SPLIT LAYOUT)                     |
|     - Merekam pesan warga secara real-time via Webhook Fonnte.                    |
|     - Admin dapat membalas obrolan langsung dari GUI Dashboard ke WA warga.       |
+-----------------------------------------------------------------------------------+
```

---

## B. Panduan Langkah demi Langkah Pendaftaran & Setup Fonnte

### Langkah 1: Registrasi Akun Fonnte
1. Buka situs resmi [Fonnte](https://fonnte.com/) melalui browser Anda.
2. Klik tombol **Daftar / Register**, lalu buat akun menggunakan alamat email resmi BUMDes Banyubening.
3. Verifikasi akun email Anda dan masuk ke halaman **Fonnte Dashboard**.

### Langkah 2: Menghubungkan Perangkat (Scan QR Code WhatsApp BUMDes)
1. Di panel menu kiri Fonnte Dashboard, pilih menu **Device**.
2. Klik tombol **+ Add Device** (atau ikon tambah perangkat).
3. Masukkan nomor WhatsApp resmi BUMDes (contoh: `081234567890`), lalu klik **Create**.
4. Sistem Fonnte akan memunculkan **QR Code WhatsApp Web**.
5. Buka aplikasi WhatsApp pada ponsel resmi operasional BUMDes → pilih menu **Perangkat Tertaut (Linked Devices)** → klik **Tautkan Perangkat** → pindai QR Code di layar komputer Anda.
6. Tunggu hingga status perangkat di Fonnte berubah menjadi **Connected / Online (Hijau)**.

### Langkah 3: Mendapatkan Token API (`FONNTE_TOKEN`)
1. Di halaman **Device** pada Fonnte Dashboard, perhatikan kolom **Token** di samping perangkat WhatsApp yang baru tertaut.
2. Klik tombol **Copy Token** (token terdiri dari karakter acak sekitar 20-30 digit).
3. Buka berkas `.env` di direktori akar dan di folder `backend/`, lalu tempelkan token tersebut:
   ```env
   FONNTE_TOKEN="abc123XYZ_Token_Fonnte_Anda_Disini"
   FONNTE_API_URL="https://api.fonnte.com/send"
   ```

---

## C. Setup Webhook Fonnte untuk Pesan Masuk (Live Chat & Bot)

Agar pesan WhatsApp yang dikirim oleh warga desa dapat diterima oleh sistem BUMDes Banyubening, Anda perlu mengatur alamat **Webhook Incoming** di panel Fonnte:

### 1. Cara Konfigurasi Webhook di Dashboard Fonnte
1. Buka Fonnte Dashboard → pilih menu **Device** → klik ikon **Edit / Settings** pada perangkat tertaut Anda.
2. Cari kolom input **Webhook URL**.
3. Masukkan alamat endpoint Webhook backend BUMDes Anda:
   ```http
   # Jika di-host pada server VPS / Railway Produksi:
   https://api.bumdesbanyubening.id/api/pengaduan/webhook

   # Jika menguji menggunakan Ngrok / Tunnel lokal:
   https://xxxx-xxxx-xxxx.ngrok-free.app/api/pengaduan/webhook
   ```
4. Aktifkan centang pada opsi **Webhook / Auto Reply**, lalu klik **Save Changes**.

### 2. Format Payload Webhook yang Diproses Backend
Ketika warga mengirimkan pesan, Fonnte akan mengirimkan HTTP `POST /api/pengaduan/webhook` ke server BUMDes dengan format JSON standar:
```json
{
  "sender": "081298765432",
  "name": "Bapak Hendro Warga RT 02",
  "message": "Selamat pagi admin BUMDes, mau menanyakan aliran air...",
  "device": "081234567890"
}
```
Backend BUMDes (`pengaduanService.processFonnteWebhook`) secara otomatis memverifikasi pengirim, merapikan nomor WhatsApp, dan memisahkan apakah pesan merupakan **Perintah Bot** atau **Pengaduan Warga**.

---

## D. Panduan Lengkap Perintah WhatsApp Bot (`Command Handler`)

Sistem BUMDes Banyubening dibekali penanganan perintah otomatis (*command handler*) untuk melayani pertanyaan warga 24/7 tanpa perlu menunggu balasan admin:

### 1. Perintah `#info` atau `#help`
- **Pesan Warga**:  
  `#info` atau `#help`
- **Respons Otomatis Bot BUMDes**:
  ```text
  *🤖 Bot WhatsApp BUMDes Banyubening*

  Halo Bapak Hendro Warga RT 02! Selamat datang di layanan otomatis BUMDes Banyubening.

  Daftar Perintah Cepat:
  • *#produk* : Lihat katalog produk dan harga BUMDes terkini
  • *#program* : Lihat jadwal dan progres program kerja desa
  • *#info* : Tampilkan menu bantuan ini

  Untuk menyampaikan pengaduan atau pertanyaan langsung ke Admin, silakan ketik pesan biasa tanpa awalan tanda #. Tim Admin kami siap membantu Anda!
  ```

### 2. Perintah `#produk`
- **Pesan Warga**:  
  `#produk`
- **Respons Otomatis Bot BUMDes**:
  - Bot melakukan query real-time ke database `Product` untuk mengambil 5 produk unggulan yang memiliki stok tersedia (`stock > 0`), lalu mengirimkan daftar harga dan informasi cara pemesanan:
  ```text
  *🛒 Produk Unggulan BUMDes Banyubening*

  1. *Air Minum Dalam Kemasan (AMDK) Air Bening Gunung 600ml*
     Harga: Rp 3.500 / botol
     Stok: 1250

  2. *Kopi Robusta Lereng Banyubening (250g)*
     Harga: Rp 35.000 / pouch
     Stok: 150

  Kunjungi website resmi kami atau balas pesan ini untuk memesan.
  ```

### 3. Perintah `#program`
- **Pesan Warga**:  
  `#program`
- **Respons Otomatis Bot BUMDes**:
  - Bot menampilkan 3 rencana dan realisasi Program Kerja desa terbaru:
  ```text
  *📋 Program Kerja & Kemajuan BUMDes Banyubening*

  1. *Pengembangan Jaringan Air Bersih Desa & Pengamanan Mata Air Gunung*
     Tanggal: 28 Juli 2026
     Tim: Tim Pengelola Air Bening Gunung & Jasa Lingkungan

  2. *Inkubator Bisnis UMKM & Digitalisasi Pemasaran Produk Desa*
     Tanggal: 15 Juli 2026
     Tim: Tim Perdagangan & Inkubator Bisnis BUMDes

  Lihat detail dokumentasi dan kolom komentar pada website resmi BUMDes Banyubening.
  ```

---

## E. Live Chat Pengaduan (WhatsApp Inbox Warga)

Jika warga mengirimkan teks biasa tanpa awalan karakter `#`, pesan tersebut langsung dicatat dalam database `PengaduanMessage` sebagai pengaduan masuk (`INCOMING`).

### 1. Sinkronisasi Real-Time dengan Socket.IO
- Setelah merekam pesan baru dari Webhook, backend memancarkan event Socket.IO:
  ```typescript
  emitNewPengaduan(savedMessage);
  ```
- Panel kiri Admin Dashboard langsung memunculkan indikator badge angka merah (*unread counter*) dan memperbarui daftar pengirim tanpa perlu me-refresh halaman.

### 2. Membalas Obrolan dari Admin Dashboard ke WhatsApp Warga
1. Di Admin Dashboard, klik tab menu **Live Chat Pengaduan (WA)**.
2. Pada panel kiri (**Kotak Masuk Warga**), klik nama warga yang ingin dibalas.
3. Panel kanan akan menampilkan gelembung percakapan lengkap.
4. Ketik pesan balasan Anda pada kotak input bawah dan klik tombol **Kirim WA**.
5. Backend akan memanggil API Fonnte untuk mengirimkan pesan balasan dengan header resmi BUMDes:
   ```text
   [BUMDes Banyubening Pengaduan Response]

   Selamat pagi Pak Hendro. Aliran air di Dusun 1 normal sejak jam 06.00 WIB pagi ini. Terima kasih.

   Terima kasih,
   Tim Layanan Pengaduan BUMDes Banyubening
   ```

---

## F. Fitur Antrean, Retry Otomatis, & Mode Demo (*Failsafe Guarantee*)

- **Antrean FIFO & Retry Mechanics**:
  - Semua pesan keluar diatur dalam antrean `wa_message_queue` di Redis/Cache untuk mencegah kebocoran *rate limit* API WhatsApp.
  - Jika pesan gagal terkirim karena jaringan Fonnte sibuk, pekerja latar belakang otomatis mencobanya kembali hingga **3 kali percobaan (*retries*)** sebelum dihentikan.
- **Mode Demo / Sandbox Pengujian**:
  - Jika `FONNTE_TOKEN` diisi dengan string `"demo_fonnte_token_bumdes_banyubening"` atau Anda menjalankan tes otomatis di lingkungan yang tidak terhubung ke Fonnte, sistem mengaktifkan **Simulated Gateway**.
  - Kode OTP login maupun balasan pesan tetap dicatat dengan aman di log Pino server sehingga alur otentikasi 2FA dan Live Chat dapat diuji 100% tanpa biaya atau ketergantungan API eksternal.
