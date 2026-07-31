# 2. Panduan Lengkap Admin Dashboard (No-Code Control System)

Dokumen ini adalah panduan lengkap bagi pengelola (SuperAdmin / Admin) BUMDes Banyubening untuk pengoperasian sistem kendali internal melalui antarmuka grafis (**GUI**) bergaya *glassmorphism* tanpa perlu menulis atau mengubah kode program (*No-Code Control System*).

---

## A. Pemisahan Domain Internal & Batas Keamanan
- **Domain Terpisah**: Admin Dashboard tidak diekspos pada situs publik (`bumdesbanyubening.plipir.id`), melainkan di-host pada domain khusus rahasia (`bumdesbanyubeningsuperadmin2025.id`).
- **Rute Login Tersembunyi (*Obfuscated Route*)**: Halaman otentikasi admin hanya dapat diakses melalui alamat khusus yang tidak dapat ditebak: `/gerbang-internal-bumdes`.
- **Perlindungan dari Mesin Pencari**: Aplikasi Admin Dashboard dilengkapi konfigurasi `robots.txt` dengan instruksi `Disallow: /` serta meta header `X-Robots-Tag: noindex, nofollow` sehingga Google atau mesin pencari lainnya tidak akan pernah mengindeks halaman internal BUMDes.

---

## B. Pengelolaan Identitas & Tampilan Latar Belakang (Tanpa Coding)

Pada tab menu **Identitas & Tema Liburan**, admin dapat mengatur seluruh identitas resmi dan aset visual utama BUMDes Banyubening:

### 1. Merubah Nama, Alamat, dan Deskripsi BUMDes
- Kolom **Nama BUMDes**: Merubah nama merek BUMDes yang tampil pada Header, Navbar, Hero, dan Footer.
- Kolom **Nama Desa / Wilayah**: Merubah sub-judul lokasi resmi (Desa Banyubening, Bejen, Temanggung).
- Kolom **Deskripsi Singkat BUMDes**: Merubah narasi misi dan visi BUMDes pada Hero Section.
- Kolom **Nomor WhatsApp Layanan**: Nomor kontak yang akan menjadi referensi tombol *Pesan via WhatsApp* di Katalog Produk.

### 2. Merubah Gambar Latar Belakang Alam Desa (*Hero Background*)
- Pengelola dapat merubah foto pemandangan mata air bening pegunungan atau desa Banyubening langsung dari komputer lokal dengan menekan tombol **Upload** di samping kolom **URL Background Alam Desa**.
- Sistem menggunakan `multer` untuk menerima berkas gambar, menyimpannya secara aman di direktori `/public/uploads/`, dan mencatat URL gambar baru di tabel `Identity`.
- **Sinkronisasi Realtime**: Begitu tombol **Simpan Perubahan Identitas** ditekan, server memancarkan event Socket.IO `content_update`, dan latar belakang di situs publik akan berganti seketika tanpa refresh halaman.

---

## C. Pengelolaan Struktur Kepengurusan ("The Floating Leaf")

Karosel pengurus **The Floating Leaf** menampilkan profil personel BUMDes dalam kartu *glassmorphism* bersudut 24px yang berputar otomatis setiap 2 detik dan memiliki modal detail saat diklik.

### 1. Menambah Personel Baru
- Buka tab menu **Pengurus (The Floating Leaf)**.
- Isi **Nama Pengurus** (misal: `Budi Santoso, S.E.`).
- Pilih atau ketik **Jabatan / Role**:
  - Role standar yang tersedia: `Direktur`, `Sekretaris 1`, `Sekretaris 2`, `Bendahara`, `Manager Jasa`, `Manager Produksi`, `Manager Perdagangan`.
  - Admin bebas menambah role kustom apapun (misal: `Kepala Unit Wisata Air Bening`, `Koordinator IT Desa`).
- Unggah foto profil bersirkular melalui tombol **Upload** pada kolom **Foto Profil Circular**.
- Tuliskan **Bio Singkat** personel yang akan tampil pada kartu karosel dan modal profil.
- Tekan **Tambah ke Floating Leaf**.

### 2. Mengubah Urutan Tampilan (*Order Index*)
- Setiap personel memiliki angka `orderIndex`. Pengurus akan urut dari angka terkecil ke terbesar pada karosel publik.

---

## D. Pengelolaan Running Text Ticker & Indikator Kategori

Running text pada situs publik memiliki efek bergradasi memudar di tepi kiri dan kanan (*disappearing into dew*) serta berhenti saat disentuh/hover.

### 1. Menambah Teks Berita / Transparansi
- Buka tab menu **Running Text (News Ticker)**.
- Tuliskan isi pesan berita (misal: `[Transparansi Keuangan] Pendapatan usaha BUMDes bulan Juni meningkat 18.5%.`).
- Pilih **Kategori Indikator**:
  - `🟢 Hijau (FINANCIAL)`: Untuk berita transparansi anggaran, bagi hasil SHU, dan pendapatan asli desa (PADes).
  - `🟡 Kuning (TRAINING)`: Untuk pengumuman pelatihan warga, workshop kemasan, dan sertifikasi UMKM.
  - `🔵 Biru (BUSINESS)`: Untuk pembukaan wahana wisata mata air, promosi produk baru, dan unit usaha.
- Tekan **Tambah Teks Berita**.

---

## E. Pengelolaan Kredensial Tanpa Kode (*No-Code Credential Management*)

- Pengelola utama tidak perlu menyentuh atau merubah source code untuk memperbarui email login (`ADMIN_EMAIL`), password (`ADMIN_PASSWORD_HASH`), PIN keamanan 10-digit (`ADMIN_PIN`), maupun nomor WhatsApp OTP (`ADMIN_WA_NUMBER`).
- Perubahan dilakukan langsung melalui panel pengaturan proyek pada layanan hosting (**Vercel → Project Settings → Environment Variables** atau Railway / VPS environment).
- Perubahan nilai variabel lingkungan akan langsung berlaku begitu server di-restart tanpa melalui proses build ulang aplikasi.
