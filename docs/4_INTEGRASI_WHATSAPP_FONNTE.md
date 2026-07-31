# 4. Panduan Integrasi WhatsApp (Fonnte Gateway, OTP & Live Chat Pengaduan)

Platform BUMDes Banyubening mengintegrasikan layanan pesan instan WhatsApp melalui **Fonnte API Gateway** (`https://api.fonnte.com/send`) dan **Webhook Fonnte**. Modul ini melayani tiga kapabilitas utama: pengiriman OTP keamanan admin, bot layanan otomatis warga, serta *Live Chat Pengaduan* dengan tampilan obrolan terpisah (*split layout*).

---

## A. Arsitektur Antrean Pesan (*Redis / In-Memory Queue System*)

Untuk menjamin keandalan pengiriman pesan WhatsApp tanpa memblokir respons HTTP aplikasi, seluruh pesan dikelola oleh sistem antrean latar belakang:
- **Penyimpanan Antrean**: Menggunakan server **Redis** atau *Enterprise In-Memory Cache Fallback* (tabel antrean `wa_message_queue`).
- **Pekerja Latar Belakang (*Background Worker*)**: Engine pengirim berjalan setiap 3 detik, mengambil pekerjaan dari antrean secara FIFO (`rpop`), dan memanggil API Fonnte dengan token yang dikonfigurasi pada `FONNTE_TOKEN`.
- **Mekanisme Retry Otomatis**: Jika Fonnte mengalami kegagalan jaringan sementara, pesan akan diantrekan kembali hingga **3 kali percobaan (*retries*)** sebelum dicatat di log kesalahan Pino.

---

## B. Pengiriman OTP Verifikasi Admin (2FA)
- Pada tahap ke-2 proses login Admin di `/gerbang-internal-bumdes/login-email`, backend membuat 6 digit angka acak dan memanggil fungsi `fonnteService.sendOtp(phone, otpCode)`.
- **Template Pesan OTP Resmi**:
  ```text
  Kode OTP Anda: XXXXXX. Berlaku 3 menit.
  ```
- Pesan dikirimkan ke nomor WhatsApp yang terdaftar pada environment variable `ADMIN_WA_NUMBER`.

---

## C. WhatsApp Bot Command Handler (#info, #produk, #program) & WhatsApp Chat Widget Shell di Situs Publik

Platform BUMDes Banyubening kini menyediakan **WhatsApp Chat Widget Shell (`WhatsAppChatWidget.tsx`)** pada halaman bawah kanan Situs Publik (`fixed bottom-6 right-6`). Antarmuka ini dirancang **sama persis seperti WhatsApp asli** dengan warna hijau khas `#075E54`, latar belakang motif percakapan `#ECE5DD`, gelembung obrolan kanan/kiri, serta penanda *checkmarks* (`✓✓`), namun **berfungsi sebagai cangkang (shell) di mana mesin pemroses pesan di baliknya 100% didukung oleh sistem Fonnte BUMDes (`pengaduanService`)**:

### 1. Perintah Bot Otomatis `#info` / `#help`
- Warga mengklik ikon WhatsApp pada situs publik atau mengetik `#info`.
- Bot langsung membalas seketika di dalam gelembung percakapan widget sekaligus mencatat log ke Fonnte Gateway dengan daftar informasi operasional BUMDes.

### 2. Perintah Bot Otomatis `#produk`
- Warga memilih *Quick Command Chip* `#produk` atau mengetik `#produk`.
- Bot mengambil daftar 5 produk terlaris dari database (`Product`) beserta harga dan stok yang tersedia, lalu membalas ke gelembung obrolan seketika.

### 3. Perintah Bot Otomatis `#program`
- Warga memilih *Quick Command Chip* `#program` atau mengetik `#program`.
- Bot menampilkan 3 program kerja desa terbaru beserta tanggal dan nama tim pelaksana.

### 4. Obrolan Pengaduan Biasa & Sinkronisasi Realtime dengan Admin
- Jika warga mengetik pesan biasa tanpa awalan `#`, pesan langsung disimpan di tabel `PengaduanMessage` sebagai pesan masuk (`INCOMING`).
- Admin di Dashboard melihat pesan tersebut secara real-time dan membalas obrolan. Balasan Admin otomatis dikirimkan ke WhatsApp warga lewat Fonnte API **DAN** dimunculkan langsung pada widget percakapan di situs publik secara seketika melalui Socket.IO (`pengaduan_reply_sent`).

---

## D. Live Chat Pengaduan (WhatsApp Inbox Warga)

Jika warga mengirimkan pesan biasa (tanpa awalan `#`), pesan tersebut dianggap sebagai **Pengaduan atau Pertanyaan Warga** yang memerlukan respons langsung dari Admin BUMDes.

```
+-----------------------------------------------------------------------------+
|              LIVE CHAT PENGADUAN - SPLIT LAYOUT ADMIN DASHBOARD             |
+------------------------------------+----------------------------------------+
|  KOTAK MASUK WARGA (PANEL KIRI)    |      RIWAYAT OBROLAN (PANEL KANAN)     |
|                                    |                                        |
|  [ Pak Budi Warga 3 ]         (1)  |  Warga (081234567899):                 |
|  081234567899                      |  "Lapor admin, saluran air di jalan    |
|  "Lapor admin, saluran air..."     |   desa tersumbat daun kering."         |
|                                    |                                        |
|  [ Ibu Ratna Pengrajin ]      ( )  |  Admin BUMDes Banyubening:             |
|  085712345678                      |  "[BUMDes Banyubening Pengaduan]       |
|  "Halo BUMDes, cara daftar..."     |   Siap Pak, tim lapangan akan segera   |
|                                    |   menuju lokasi. Terima kasih."        |
|                                    |                                        |
|                                    |  +----------------------------------+  |
|                                    |  | Tulis balasan untuk WA warga...  |  |
|                                    |  +----------------------------------+  |
|                                    |  [ KIRIM BALASAN KE WHATSAPP WARGA ]   |
+------------------------------------+----------------------------------------+
```

### 1. Webhook Incoming & Push Realtime Socket.IO
- Webhook Fonnte memvalidasi nomor pengirim (`senderNumber`) dan isi pesan (`messageText`).
- Pesan direkam dalam tabel `PengaduanMessage` dengan status `UNREAD` dan tipe `INCOMING`.
- Server memancarkan event Socket.IO `new_pengaduan_message` ke ruangan `admin_dashboard`. Layar Admin Dashboard langsung menampilkan pesan baru tanpa refresh halaman.

### 2. Panel Kiri: Daftar Warga Pengirim Pesan
- Menampilkan daftar nama/nomor warga yang pernah mengontak BUMDes diurutkan berdasarkan waktu pesan terakhir.
- Dilengkapi **Badge Angka Merah** untuk menampilkan jumlah pesan yang belum dibaca (`UNREAD`).
- Mengklik salah satu nama warga akan merubah status pesan menjadi `READ` dan memuat percakapan lengkap di panel kanan.

### 3. Panel Kanan: Obrolan & Pengiriman Balasan Langsung ke WA Warga
- Menampilkan riwayat percakapan secara runtut (gelembung putih untuk pesan masuk warga, gelembung hijau untuk balasan Admin).
- **Pengiriman Balasan**:
  - Admin mengetik pesan di kotak input bawah dan menekan **Kirim WA**.
  - Backend memanggil `fonnteService.sendPengaduanReply(cleanNumber, replyText)` dengan template header resmi:
    ```text
    [BUMDes Banyubening Pengaduan Response]

    <Isi Balasan Admin>

    Terima kasih,
    Tim Layanan Pengaduan BUMDes Banyubening
    ```
  - Pesan balasan direkam ke tabel `PengaduanMessage` dengan tipe `OUTGOING` dan langsung dimunculkan pada gelembung obrolan Admin.
