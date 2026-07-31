# 3. Panduan Sistem Program Kerja & Moderasi Komentar (Modern Rustic Showcase)

Sistem **Program Kerja** didesain sebagai etalase interaktif bergaya *Modern Rustic* dengan palet warna bumi (latar belakang gading `#FFFDD0` / `#FAF8F5`, teks batu alam `#4A4A4A`, dan aksen hijau sage `#87A96B`). Modul ini memungkinkan masyarakat memantau rencana, realisasi, dan dokumentasi pembangunan desa serta memberikan komentar atau masukan secara langsung.

---

## A. Pengelolaan Konten & Blok Alternatif (Teks / Gambar)

Setiap entri Program Kerja terdiri dari informasi utama (Judul, Tanggal, Nama Tim Pelaksana) dan urutan blok konten alternatif (*content blocks*) yang terdiri dari blok teks narasi atau blok gambar dokumentasi.

### 1. Menambah Program Kerja Baru
- Di Admin Dashboard, pilih tab menu **Program Kerja & Komentar**.
- Isi **Judul Program Kerja**, **Tanggal Pelaksanaan**, dan **Tim / Pelaksana Program**.
- **Penyusunan Blok Konten Alternatif**:
  - Secara default formulir menyediakan Blok #1. Anda dapat merubah tipenya menjadi:
    - **Teks Narasi (Auto-Pagination)**: Kolom teks untuk menuliskan penjelasan detail program.
    - **Gambar Dokumentasi**: Kolom URL gambar yang dilengkapi tombol **Upload** file foto lapangan.
  - Klik tombol **+ Tambah Blok Konten Alternatif (+1)** untuk menambah blok selanjutnya dengan urutan bebas (misal: Teks → Gambar → Teks → Gambar).
- Klik **Simpan & Terbitkan Program Kerja**.

---

## B. Fitur Auto-Pagination Halaman (1 dari 3) pada Frontend

- Untuk menjaga antarmuka tetap tenang, rapi, dan tidak memakan layar bergulir terlalu panjang, sistem memiliki algoritma **Auto-Pagination** pada blok teks narasi.
- Jika teks penjelasan suatu blok melebihi ~500 karakter atau terdiri dari beberapa paragraf panjang, frontend secara otomatis membagi teks tersebut menjadi beberapa halaman (misal: *Halaman 1 dari 3*).
- Di bawah teks terpasang indikator halaman beserta tombol navigasi `◀️` dan `▶️` dengan transisi efek *fade-in* yang halus dan responsif di semua ukuran layar (perangkat mobile maupun desktop).

---

## C. Kontrol Tombol Aktif / Nonaktif Komentar Admin (*Comment Toggle*)

Admin memiliki kewenangan penuh untuk membuka atau menutup ruang komentar pada setiap program kerja sewaktu-waktu:
- Pada kartu daftar program kerja di Admin Dashboard, klik tombol status **Komentar Aktif** / **🔒 Komentar Nonaktif**.
- Jika admin menonaktifkan komentar suatu program kerja:
  - Form input komentar dan seluruh komentar warga yang sudah ada akan disembunyikan dari layar situs publik.
  - Sebagai gantinya, sistem menampilkan kotak pesan peringatan:  
    `🔒 Kolom komentar untuk program kerja ini telah dinonaktifkan oleh Admin.`

---

## D. Sistem Komentar Threaded Bergaya Instagram

Masyarakat desa dan publik dapat berinteraksi memberikan apresiasi atau masukan pada program kerja melalui kolom komentar bergaya media sosial Instagram:

```
[Komentar Induk: Supriyanto Warga Dusun 2]
"Alhamdulillah pipa air bersih desa sudah masuk ke area RT 04. Aliran lancar!" ❤️ 👏
     |
     +-- [Balasan (Indented): Tim Pengelola Air Bening Gunung]
         "Membalas @supriyanto.warga2@banyubening.id (To leave a comment...) 
          Terima kasih Pak Supriyanto atas apresiasinya. Mari bersama kita jaga kebersihannya!" 👍 🙌
```

### 1. Interaksi & Emoji Picker
- Pada kolom input komentar, terdapat ikon senyum (`Smile`) yang jika diklik akan memunculkan popup interaktif berisi emoji populer (`❤️`, `👍`, `👏`, `🔥`, `🙌`).
- Emoji yang dipilih akan otomatis dimasukkan ke posisi kursor pada teks komentar.

### 2. Fitur Balas (*Reply*)
- Setiap komentar memiliki tombol **Balas**.
- Mengklik tombol Balas akan mengaktifkan mode balasan dengan format:  
  `Membalas @Email (To leave a comment, you must first login with your email, the email address will stored in the admin dashboard-only the email itself, not the password-to ensure privacy)`
- Balasan yang dikirim akan otomatis disimpan dengan relasi `parentId` pada tabel database `Comment` dan ditampilkan menjorok (*indented*) di bawah komentar induk.

---

## E. Kebijakan Privasi Alamat Email Warga

Sesuai dengan ketentuan perlindungan privasi yang ketat dalam kontrak eksekusi:
- **Di Antarmuka Situs Publik**: Respons API `GET /api/program-kerja/:id` secara otomatis **menghapus/menyembunyikan field email warga**. Publik hanya dapat melihat nama komentar, teks komentar, dan cap waktu.
- **Di Admin Dashboard**: Ketika Admin login dengan otentikasi JWT yang sah dan mengakses tab **Program Kerja & Komentar**, alamat email warga ditampilkan secara jelas di samping nama pengguna (misal: `warga.test@banyubening.id`) untuk verifikasi identitas warga desa.
- Admin dapat menekan tombol **Hapus** pada ikon tempat sampah untuk memoderasi atau menghapus komentar yang tidak pantas dari sistem.
