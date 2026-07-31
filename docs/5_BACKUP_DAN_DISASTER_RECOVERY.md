# 5. Panduan Backup Database & Disaster Recovery (Google Drive Integration)

Sistem BUMDes Banyubening mengimplementasikan mekanisme pencadangan otomatis ber-versi (*versioned backups*) serta pemulihan bencana (*disaster recovery*) terintegrasi secara langsung dengan layanan penyimpanan awan **Google Drive API v3**.

---

## A. Arsitektur Pencadangan & Penyimpanan
- **Folder Cadangan Lokal**: Setiap proses pencadangan menghasilkan arsip snapshot ber-timestamp yang disimpan pada direktori `/home/user/BUMDes-BANYUBENING/backups/`.
- **Penamaan Berkas Ber-versi**:  
  `bumdes-banyubening-backup-YYYY-MM-DDTHH-mm-ss-SSSZ.db`
- **Tabel Log Pencadangan (`BackupLog`)**:
  - Menyimpan rekam jejak nama file (`filename`), ukuran file (`fileSize`), status eksekusi (`SUCCESS` / `FAILED`), dan ID file pada Google Drive (`googleDriveFileId`).

---

## B. Pencadangan Otomatis via Cron Job (`node-cron`)

- Server Express backend memiliki *cron scheduler* yang dikonfigurasi pada file `server.ts`:
  ```typescript
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running automated daily cron backup for BUMDes Banyubening database');
    await googleDriveBackupService.createBackup('SYSTEM_CRON');
  });
  ```
- Setiap hari pada pukul **00:00 UTC (Tengah Malam)**, sistem secara otomatis:
  1. Membuat salinan arsip database `dev.db` (atau eksport manifest bila menggunakan Supabase PostgreSQL).
  2. Mengotentikasi akun layanan Google Drive API.
  3. Mengunggah berkas tersebut ke Google Drive folder ID yang ditetapkan pada `GOOGLE_DRIVE_FOLDER_ID`.
  4. Mencatat log keberhasilan ke dalam tabel `BackupLog` dan `AuditLog`.

---

## C. Konfigurasi Google Drive API v3 (Service Account)

Untuk mengaktifkan pengunggahan langsung ke folder Google Drive BUMDes, tambahkan konfigurasi variabel lingkungan pada berkas `.env` server:

```env
GOOGLE_DRIVE_FOLDER_ID="1BUMDesBanyubeningBackupFolderIdExample2026"
GOOGLE_SERVICE_ACCOUNT_EMAIL="backup-service@bumdes-banyubening.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
```

### Langkah Setup Service Account Google Drive:
1. Buka [Google Cloud Console](https://console.cloud.google.com/) dan aktifkan **Google Drive API**.
2. Buat **Service Account** baru dan unduh berkas kunci berformat JSON.
3. Salin `client_email` ke variabel `GOOGLE_SERVICE_ACCOUNT_EMAIL` dan `private_key` ke `GOOGLE_PRIVATE_KEY` (pastikan ganti baris baru dengan `\n`).
4. Buka folder tujuan backup di Google Drive Anda, klik **Share (Bagikan)**, lalu masukkan alamat email Service Account sebagai **Editor**.
5. Salin ID folder dari URL browser ke variabel `GOOGLE_DRIVE_FOLDER_ID`.

*Catatan Sandbox / Development*: Jika konfigurasi Google Drive belum diisi atau menggunakan akun contoh, sistem secara otomatis menyimpan cadangan dalam repositori lokal `/backups/` dan menandai ID sebagai `LOCAL_ARCHIVE` tanpa memunculkan kesalahan aplikasi.

---

## D. Operasi Lewat GUI Admin Dashboard (Tanpa Coding)

Pada tab menu **Backup & Google Drive** di Admin Dashboard:

### 1. Membuat Backup Manual Sekarang
- Tekan tombol **Buat Backup Manual Sekarang**.
- Backend akan mengeksekusi `POST /api/backup/manual`, membuat salinan arsip baru, mengunggah ke Google Drive, dan menampilkan riwayat cadangan baru pada tabel GUI.

### 2. Mengunduh Berkas Arsip Backup
- Tekan ikon unduh (**Download**) di samping baris riwayat cadangan.
- Aplikasi akan mengunduh berkas `.db` langsung ke perangkat lokal admin.

### 3. Memulihkan Database dari Cadangan (*Restore Disaster Recovery*)
- Tekan tombol **Pulihkan (Restore)** pada baris cadangan yang dipilih.
- Sistem akan meminta konfirmasi peringatan. Jika dilanjutkan, sistem memanggil `POST /api/backup/restore`, menyalin atau mengunduh arsip yang dipilih dari Google Drive, menggantikan database aktif dengan versi cadangan tersebut, dan mencatat log audit `RESTORE_BACKUP`.
