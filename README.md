# KASIRKU — Aplikasi Kasir Offline BUMDes

Aplikasi kasir **100% offline** untuk BUMDes: penjualan, stok, piutang, hutang, pembayaran listrik & pulsa, invoice F4, laporan keuangan, struk thermal, dan backup lokal. Dibangun dengan **Expo React Native + TypeScript strict** untuk Android (minSdk 24) dan iOS.

Tidak ada API online, akun cloud, GPS, maupun autentikasi biometrik. Seluruh data tersimpan di SQLite perangkat.

---

## Fitur

| Modul | Ringkasan |
| --- | --- |
| **Autentikasi** | Registrasi 2 langkah, PIN numerik 6 digit (bcrypt), app lock saat aplikasi dibuka kembali, tanpa auto-login. Logout = factory reset (konfirmasi + verifikasi PIN, seluruh data dihapus). |
| **Dashboard** | Header gradien, jam 7-segmen, running text (speaker.png), statistik hari ini, grafik 7 hari, peringatan stok minimum, menu cepat. |
| **Kasir** | Layar landscape split-screen (produk + keranjang), pencarian/scan barcode, kalkulator, item jasa (listrik, pulsa/paket data), pembayaran tunai/QRIS/piutang, simpan transaksi atomik, cetak otomatis. |
| **Produk** | CRUD dengan soft delete, kompresi gambar, kategori & satuan (dropdown + tambah baru), stok opname, produk terlaris, stok rendah. |
| **Listrik PLN** | Data pelanggan tersimpan otomatis (IDPEL, nama, tarif/daya), tagihan + admin bank + biaya llyn + denda, total dibulatkan **ceil500**, struk khusus. |
| **Pulsa / Paket Data** | Operator & jenis paket, validasi nomor, harga jual, tanpa HPP (laba = harga jual). |
| **Riwayat & Laporan** | Filter harian/mingguan/bulanan, grafik batang & pie, produk terlaris, piutang jatuh tempo, export **PDF merah** dan **CSV hijau**. |
| **Keuangan** | Laba rugi, neraca, LPE, arus kas, pencatatan beban, penutupan buku otomatis tiap bulan (WIB). |
| **Hutang** | Pencatatan hutang per pelanggan, detail item, status lunas (menghapus catatan), notifikasi lokal. |
| **Invoice** | Invoice F4 (215,9 × 330,2 mm) dengan nomor `INV/000001`, 7 kolom item, terbilang, dua tanda tangan, counter reset setelah 999999. |
| **Pengaturan** | Profil & logo terpadu, mode gelap, pengaturan akun/PIN, printer, backup-restore, setup invoice, notifikasi. |
| **Backup / Restore** | Arsip **ZIP lokal** berisi database, logo, dan foto produk; dibagikan lewat Share Sheet. Restore via pemilih berkas `.zip`. Tanpa Google Drive/OAuth. |
| **Printer** | ESC/POS 58 mm & 80 mm, template struk A/B/C, pemindaian printer, test print, riwayat koneksi, auto-reconnect sebelum pesan "Printer Tidak Terhubung". |

---

## Teknologi

- Expo SDK **54** (React Native 0.81, React 19.1)
- Expo Router 6 (file-based routing, 4 tab + FAB Kasir)
- SQLite (`expo-sqlite`), akses melalui repository
- Zustand untuk state global
- `expo-print` + `expo-sharing` untuk PDF/CSV, `jszip` untuk backup
- `bcryptjs` untuk PIN, `expo-crypto` sebagai sumber acak native
- Reanimated 4 untuk animasi PinPad
- React Native SVG untuk grafik

---

## Menjalankan

Prasyarat: Node 20+, aplikasi **Expo Go** atau emulator Android/iOS.

```bash
npm install --legacy-peer-deps
npx expo start          # QR code untuk Expo Go
npx expo run:android    # build native (butuh Android Studio)
```

Build produksi (EAS):

```bash
npm install -g eas-cli
eas build -p android --profile production-apk   # APK internal (eas.json)
```

> Catatan: folder `android/` dan `ios/` tidak disimpan di repo (dibuat oleh `npx expo prebuild`).

### Perintah bantu

```bash
npm run typecheck     # tsc --noEmit
npm run test:utils    # uji ceil500, rupiah, terbilang, invoiceRef, dll.
npm run test:scale    # uji aturan skala ms()/sh()
npm run icons         # regenerasi aset ikon (butuh sharp)
npm run export:android
```

---

## Struktur Proyek

```
app/                        # rute Expo Router
  (auth)/                   # login, register, register-pin
  (tabs)/                   # dashboard, produk, riwayat, pengaturan
  kasir.tsx                 # layar kasir landscape
  payment.tsx               # pembayaran
  form-*.tsx                # form produk/listrik/pulsa
  invoice-*.tsx             # setup, daftar, editor invoice
  hutang.tsx, keuangan.tsx  # modul hutang & laporan keuangan
  printer.tsx, backup-restore.tsx, logo-setup.tsx,
  account-settings.tsx, notifikasi-pengaturan.tsx
src/
  core/                     # tema, skala, util, konstanta, service
  data/database/            # skema & helper SQLite
  data/repositories/        # satu-satunya akses SQL
  store/                    # Zustand (auth, cart, printer, tema, banner, register)
  shared/components/        # 30 komponen UI
  features/                 # dashboard, kasir, printer, laporan, invoice, notifikasi, auth
assets/
  icon/                     # 48 ikon PNG 512×512 (flat line)
  iconaplikasi.png          # ikon launcher 152×152
scripts/                    # generator ikon & uji util/skala
```

**Aturan arsitektur:** layar tidak menulis SQL. Alur data: `UI → Zustand/repository → SQLite`. Semua operasi multi-tabel (transaksi, hutang, tutup buku) dibungkus `withTransaction`.

---

## Basis Data

15 tabel: `users`, `app_settings`, `business_units`, `products`, `customers`, `transactions`, `transaction_details`, `shifts`, `receivables`, `held_carts`, `pln_customers`, `hutang`, `hutang_items`, `expenses`, `book_closing_log`.

- ID berupa UUID v4, timestamp ISO, tanpa foreign key fisik (integritas dijaga di repository).
- `transactions.invoice_number` memakai `TRX-` + 8 karakter UUID.
- Nomor invoice (`INV/######`) disimpan di `app_settings.invoiceCounter` dan direset ke 1 setelah 999999.
- `transaction_details.cost_amount` menyimpan HPP: listrik = tagihan + admin + denda, pulsa = 0, produk = harga beli × qty.
- `service_data_json` menyimpan detail layanan untuk cetak ulang struk template B.

### Rumus laporan

- Pendapatan = total transaksi berstatus `completed`
- Laba kotor = pendapatan − HPP
- Laba listrik = Σ(subtotal − cost_amount); laba pulsa = Σ(subtotal)
- Laba bersih = laba kotor + laba listrik + laba pulsa − beban
- Kas = tunai (cash_amount − kembalian) + QRIS (total + admin_fee)
- Piutang = sisa tagihan belum lunas; Persediaan = harga beli × stok
- Kewajiban = total hutang; Ekuitas = modal awal + laba ditahan sejak tutup buku terakhir

---

## Alur Penting

- **Transaksi:** validasi keranjang → simpan `transactions` + `transaction_details` → kurangi stok → buat piutang bila kredit → cetak struk otomatis. Semua dalam satu transaksi SQLite.
- **PIN:** hanya 6 digit numerik. Tidak ada sidik jari/face ID dan `expo-local-authentication` tidak dipasang.
- **Tutup buku otomatis:** dijalankan saat aplikasi dibuka, sekali per bulan WIB; hasil disimpan di `book_closing_log`.
- **Cache:** pembersihan otomatis harian (satu kali per hari), file sementara di `cacheDirectory`, log diputar 7 hari.
- **Restore:** menimpa database dan folder gambar; pengguna diminta me-restart aplikasi.
- **Logo:** satu logo (`app_settings.bumdesLogo`) dipakai di dashboard, login, struk, invoice, dan laporan.
- **Printer:** status tunggal dari `printerService`/`printerStore`. Tanpa printer fisik, cetak ditampilkan sebagai pratinjau virtual.

---

## Aset & Ikon

Seluruh ikon di `assets/icon/` (512×512, latar transparan, garis tebal) dihasilkan oleh `scripts/generate-icons.js` dengan palet `#0C3B6E`, `#2F86D1`, `#D8A93E`. Ikon launcher dibuat oleh `scripts/generate-launcher.js`.

**Ikon dan launcher saat ini adalah placeholder hasil generasi otomatis** — silakan ganti dengan aset final tanpa mengubah nama berkas. `assets/iconaplikasi.png` berukuran 152×152 dan dipakai sebagai ikon aplikasi serta splash.

---

## Pengujian

Yang sudah diverifikasi di lingkungan pengembangan:

- `npx tsc --noEmit` bersih (strict), juga bersih saat `noUnusedLocals`/`noUnusedParameters` diaktifkan
- `npm run test:utils` — 25 vektor uji, termasuk `ceil500(24271) = 24500`, `formatRupiah(10000) = "Rp 10.000"`, `terbilang(26000)`, `invoiceRef(1000000) = "INV/000001"`
- `npm run test:scale` — aturan skala `ms()`/`sh()`
- `npx expo export --platform android` berhasil (Metro, 3.700+ modul)

Pengujian di perangkat (alur kasir, printer Bluetooth, restore ZIP) perlu dilakukan manual karena membutuhkan perangkat fisik.

---

## Batasan

- Aplikasi tidak memakai internet; tidak ada sinkronisasi cloud.
- APK/AAB tidak disertakan dalam repo — build melalui EAS atau `expo run:android`.
- Printer thermal Bluetooth memerlukan perangkat keras nyata; tanpa itu aplikasi memakai pratinjau virtual.
- Ikon bawaan adalah placeholder generatif, bukan karya desainer.
