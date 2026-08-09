# Automated Comic Translator

Automated Comic Translator adalah sistem **one-click in-place translation** untuk komik, manga, dan manhwa di web. Solusi ini terdiri dari:

- **Chrome Extension** berbasis **Manifest V3 + TypeScript + Vite**
- **Backend** berbasis **FastAPI + Pillow + OpenCV**
- Integrasi OCR / inpainting / translation yang dirancang agar tetap **resilient** saat dependensi ML berat belum dipasang

Tujuan utamanya sederhana: **klik tombol Translate di atas gambar komik, lalu teks lama dihapus dan diganti terjemahan langsung di halaman yang sama**.

---

## Fitur Utama

- **One-click in-place translation** pada elemen `<img>` di halaman web
- **PaddleOCR** dengan `use_angle_cls=True` untuk teks horizontal dan vertikal
- **LaMa inpainting** untuk membersihkan teks lama tanpa merusak artwork
- **Batch translation + failover provider**: Google → MyMemory → LibreTranslate
- **Pillow renderer** dengan auto wrap, dynamic font scaling, centered text, dan stroke
- **Manifest V3-safe build**: content script dan service worker dibundel sebagai **IIFE**, bukan ES module
- **Resilient backend startup**: `/health` tetap hidup dengan status `degraded` bila OCR/LaMa belum tersedia

---

## Struktur Proyek

```text
automated-comic-translator/
├── install.sh / install.bat / install.ps1
├── run.sh / run.bat / run.ps1
├── README.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ocr_service.py
│   │   │   ├── inpaint_service.py
│   │   │   ├── translator_service.py
│   │   │   └── renderer_service.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── image_utils.py
│   ├── models/
│   │   └── README.md
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_image_utils.py
│   │   ├── test_renderer.py
│   │   ├── test_translator.py
│   │   └── test_main.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── .env.example
│   └── Dockerfile
└── extension/
    ├── manifest.json
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── vite.content.config.ts
    ├── vite.background.config.ts
    ├── _locales/en/messages.json
    └── src/
        ├── background/service-worker.ts
        ├── content/content.ts
        ├── content/overlay.css
        ├── popup/popup.html
        ├── popup/popup.ts
        ├── popup/popup.css
        └── utils/api.ts
```

---

## Arsitektur Pipeline

1. **User** menekan tombol **Translate** di atas gambar komik.
2. **Content script** meminta service worker mengambil gambar sebagai **Blob / data URL** agar aman dari CORS / tainted canvas.
3. **Service worker** mengirim `POST http://localhost:8000/api/v1/translate`.
4. **Backend pipeline** berjalan:
   - decode base64 → PIL
   - downscale sesuai `MAX_IMAGE_SIZE`
   - OCR
   - translation batch + failover
   - masking + dilation
   - LaMa inpainting
   - Pillow text rendering
   - encode ulang ke data URL PNG
5. **Frontend** menimpa `img.src` di DOM dengan hasil terjemahan.

---

## Mulai dari Mana? Ikuti Urutan Ini

Kalau Anda masih bingung harus mulai dari mana, gunakan urutan berikut.

### Urutan paling mudah di Windows CMD

1. Buka **Command Prompt**.
2. Masuk ke folder proyek:

```bat
cd D:\comic_translator\automated-comic-translator
```

3. Jalankan instalasi sekali saja:

```bat
install.bat
```

4. Setelah instalasi selesai, jalankan program:

```bat
run.bat
```

5. Biarkan jendela CMD yang menjalankan backend **tetap terbuka**.
6. Buka Chrome → `chrome://extensions` → aktifkan **Developer mode**.
7. Klik **Load unpacked** lalu pilih folder:

```text
D:\comic_translator\automated-comic-translator\extension\dist
```

8. Buka halaman komik/gambar di browser.
9. Klik tombol **Translate** di atas gambar.

> **Intinya:** untuk pemakaian normal Anda cukup ingat dua perintah:
>
> ```bat
> install.bat
> run.bat
> ```
>
> Anda **tidak perlu** menjalankan `cp backend/.env.example backend/.env` secara manual jika sudah memakai `install.bat`, karena file `.env` dibuat otomatis oleh installer.

### Urutan paling mudah di PowerShell

```powershell
cd D:\comic_translator\automated-comic-translator
powershell -ExecutionPolicy Bypass -File .\install.ps1
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

### Urutan paling mudah di Linux / macOS

```bash
cd /path/to/automated-comic-translator
./install.sh
./run.sh
```

---

## Instalasi Satu Perintah

> Semua skrip dijalankan dari folder `automated-comic-translator/`.

### Prasyarat penting

- **Python yang didukung:** **CPython 3.10-3.13 64-bit**
- **Versi yang paling direkomendasikan:** **Python 3.11 64-bit**
- **Node.js:** 18+

> Jangan gunakan Python yang terlalu baru seperti 3.14/3.15 bila wheel paket belum tersedia. Pada Windows, itu sering memicu error build `numpy`, `meson`, atau compiler `cl/gcc/clang not found`.
> Skrip `install.bat` dan `install.ps1` sekarang akan mencoba memakai `py -3.13`, `py -3.12`, `py -3.11`, lalu `py -3.10` secara otomatis bila tersedia.

### Linux / macOS

```bash
./install.sh
```

### Windows Command Prompt

```bat
install.bat
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Yang dilakukan skrip install:

1. mengecek `python`/`python3` dan `npm`
2. membuat `backend/.venv` bila belum ada
3. meng-upgrade `pip`
4. memasang dependency backend dari `backend/requirements.txt`
5. memasang tool dev backend (`pytest`, `ruff`, `httpx`) ke `.venv`
6. menjalankan `npm install` di `extension/`
7. membuat `backend/.env` dari `.env.example` bila belum ada

> Di Windows CMD, folder `backend/` juga menyediakan `python.bat` yang meneruskan perintah ke `backend\.venv\Scripts\python.exe`. Jadi setelah `cd backend`, perintah seperti `python -m pytest` akan memakai virtualenv lokal proyek.

---

## Menjalankan Sistem

### Perintah normal setelah install

#### Linux / macOS

```bash
./run.sh
```

#### Windows Command Prompt

```bat
run.bat
```

#### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

### Mode Run yang Tersedia

| Mode | Linux/macOS | Windows cmd | PowerShell | Fungsi |
|---|---|---|---|---|
| Normal | `./run.sh` | `run.bat` | `./run.ps1` | Build extension lalu jalankan backend |
| Watch | `./run.sh --watch` | `run.bat --watch` | `./run.ps1 -Watch` | Build extension, buka mode watch, lalu jalankan backend |
| Build only | `./run.sh --build-only` | `run.bat --build-only` | `./run.ps1 -BuildOnly` | Hanya build extension ke `extension/dist/` |

> Skrip run **tidak pernah me-source seluruh file `.env`**. Hanya `HOST` dan `PORT` yang diambil secara aman dari `backend/.env`.
>
> Kalau Anda hanya ingin memakai aplikasinya, urutannya adalah:
>
> 1. `install.bat` atau `install.ps1` atau `install.sh`
> 2. `run.bat` atau `run.ps1` atau `run.sh`
> 3. load extension dari `extension/dist`
> 4. buka halaman komik dan klik **Translate**

---

## Memuat Extension di Chrome

1. Jalankan mode normal atau build-only agar folder `extension/dist/` terbentuk.
2. Buka `chrome://extensions`.
3. Aktifkan **Developer mode**.
4. Klik **Load unpacked**.
5. Pilih folder `extension/dist/`.

Build yang valid akan menghasilkan file berikut:

```text
extension/dist/
├── manifest.json
├── background/service-worker.js
├── content/content.js
├── content/overlay.css
├── popup/popup.html
├── popup/popup.js
├── popup/popup.css
└── _locales/en/messages.json
```

Output JS dibundel sebagai **IIFE**, sehingga tidak ada `import` / `export` top-level yang melanggar content script MV3.

---

## Konfigurasi Backend

### Apakah saya perlu menyalin `.env` manual?

- **Kalau Anda memakai `install.bat`, `install.ps1`, atau `install.sh`: tidak perlu.**
  Installer akan otomatis membuat `backend/.env` dari `backend/.env.example` bila file itu belum ada.
- **Kalau Anda setup manual tanpa installer:** baru salin file `.env` sendiri sesuai sistem operasi Anda.

### Cara menyalin `.env` secara manual

#### Linux / macOS

```bash
cp backend/.env.example backend/.env
```

#### Windows Command Prompt

```bat
copy backend\.env.example backend\.env
```

#### Windows PowerShell

```powershell
Copy-Item backend/.env.example backend/.env
```

> Kalau di Windows CMD Anda mengetik `cp ...` lalu muncul error:
>
> ```text
> 'cp' is not recognized as an internal or external command
> ```
>
> itu normal, karena `cp` adalah perintah shell Unix/Linux, bukan CMD Windows.
> Di CMD gunakan `copy`, bukan `cp`.

Kunci penting:

### Server

- `APP_NAME=Automated Comic Translator`
- `VERSION=1.0.0`
- `API_V1_PREFIX=/api/v1`
- `HOST=0.0.0.0`
- `PORT=8000`
- `CORS_ORIGINS=*`
- `MAX_UPLOAD_MB=20`

### Translation

- `DEFAULT_SOURCE_LANG=auto`
- `DEFAULT_TARGET_LANG=id`
- `TRANSLATOR_PRIMARY=google`
- `TRANSLATOR_FALLBACKS=mymemory,libretranslate`
- `LIBRETRANSLATE_URL=http://localhost:5000`
- `ENABLE_BATCH_TRANSLATION=true`
- `BATCH_DELIMITER=\n-----\n`

### OCR

- `OCR_LANG=japan`
- `USE_ANGLE_CLS=true`
- `OCR_THRESHOLD=0.5`
- `OCR_DET_DB_THRESH=0.3`
- `OCR_DET_DB_BOX_THRESH=0.6`
- `OCR_DET_DB_UNCLIP_RATIO=1.5`

### Inpainting

- `MODEL_DIR=./models`
- `DEVICE=cpu`
- `MASK_DILATION=5`
- `MAX_IMAGE_SIZE=2000`

### Rendering

- `FONT_PATH=`
- `MIN_FONT_SIZE=10`
- `MAX_FONT_SIZE=40`
- `STROKE_RATIO=0.20`
- `TEXT_FILL=#FFFFFF`
- `STROKE_FILL=#000000`

---

## API Reference

### `GET /health`

Memeriksa status server dan model.

Contoh respons:

```json
{
  "status": "degraded",
  "app": "Automated Comic Translator",
  "version": "1.0.0",
  "device": "cpu",
  "models": {
    "ocr": false,
    "inpaint": false
  }
}
```

Catatan:

- `status: "ok"` bila OCR dan inpainting siap
- `status: "degraded"` bila dependency ML belum tersedia, tetapi server tetap hidup

### `POST /api/v1/translate`

Request body:

```json
{
  "image": "data:image/png;base64,...",
  "target_lang": "id",
  "source_lang": "auto",
  "max_size": 2000
}
```

Response body:

```json
{
  "image": "data:image/png;base64,...",
  "translations": [
    {
      "original": "こんにちは",
      "translated": "Halo",
      "confidence": 0.99,
      "bbox": [20, 20, 140, 60]
    }
  ],
  "processing_time_ms": 2450.12,
  "width": 1280,
  "height": 1920
}
```

Error umum:

- `400` bila payload gambar tidak valid
- `500` bila pipeline runtime gagal

---

## Detail Implementasi Penting

### Backend

- **Lazy import** untuk PaddleOCR, deep-translator, dan LaMa agar test tidak butuh torch / PaddleOCR
- `load_models()` di startup dibuat **best-effort** agar server tidak crash jika model berat belum bisa dimuat
- `translate_batch()` menggabungkan semua line menggunakan delimiter, lalu failover provider bila gagal
- `fit_text_to_bbox()` mengecilkan font dari `MAX_FONT_SIZE` ke `MIN_FONT_SIZE` sampai teks muat
- `word_wrap()` otomatis memilih wrap per kata untuk Latin dan per karakter untuk CJK
- `zip(..., strict=False)` dipakai agar pipeline toleran terhadap mismatch panjang array

### Extension

- Manifest V3 mewajibkan content script final **bukan ES module**
- Karena itu build dipisah menjadi tiga config Vite:
  - `vite.config.ts` → popup + static assets
  - `vite.content.config.ts` → `content/content.js`
  - `vite.background.config.ts` → `background/service-worker.js`
- `emptyOutDir: false` dipakai pada build content/background agar hasil build sebelumnya tidak terhapus
- Pengambilan gambar cross-origin dilakukan di **service worker**, bukan canvas di content script
- State setting disimpan di `chrome.storage.local`, bukan global variable service worker

---

## Testing dan Quality Check

### Backend

#### Windows Command Prompt

```bat
cd backend
python -m pytest
python -m ruff check .
```

#### PowerShell

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

#### Linux / macOS

```bash
cd backend
./.venv/bin/python -m pytest
./.venv/bin/python -m ruff check .
```

Di Windows CMD, `python` di dalam folder `backend/` akan diarahkan ke virtualenv proyek melalui `backend/python.bat`.

Test suite mencakup:

- roundtrip Base64 ↔ PIL ↔ OpenCV
- downscale
- word wrap Latin dan CJK
- fit text to bbox
- render text
- batch translation join/split
- provider failover
- fallback ke teks sumber
- `/health`
- full translation pipeline dengan service mock
- kasus tanpa teks
- invalid image → `400`

### Extension

```bash
cd extension
npm run build
```

Checklist build:

- `manifest.json` tersalin ke `dist/`
- file popup/content/background terbentuk
- output JS tidak mengandung top-level `import` / `export`

---

## Docker

Backend menyediakan `backend/Dockerfile` berbasis `python:3.11-slim`.

Contoh build dan run:

```bash
cd backend
docker build -t act-backend .
docker run --rm -p 8000:8000 act-backend
```

---

## Troubleshooting

### 1. `/health` menunjukkan `degraded`

Itu berarti server hidup, tetapi model OCR dan/atau LaMa belum tersedia penuh.

- jika **PaddleOCR** belum siap, proses OCR tidak akan bekerja sampai dependensinya benar
- jika **LaMa** belum tersedia, backend sekarang akan **fallback ke OpenCV inpaint** agar translasi tetap bisa berjalan, walau kualitas pembersihan teks biasanya tidak sebaik LaMa

Untuk kualitas terbaik, pastikan dependency ML terpasang dengan benar.

### 2. `install.bat` gagal saat memasang `numpy` / muncul error `meson` / compiler `cl`, `gcc`, `clang` tidak ditemukan

Penyebab paling umum: Anda memakai **Python yang terlalu baru** sehingga pip tidak menemukan wheel prebuilt, lalu mencoba build dari source.

Solusi:

1. gunakan **CPython 3.10-3.13 64-bit**
2. paling aman gunakan **Python 3.11 64-bit**
3. hapus folder `backend\.venv` jika sebelumnya sudah dibuat dengan Python yang salah
4. jalankan ulang `install.bat` atau `install.ps1`

Jika Anda punya beberapa Python di Windows, skrip installer akan mencoba `py -3.13`, `py -3.12`, `py -3.11`, lalu `py -3.10` secara otomatis.

### 3. `python -m pytest` atau `python -m ruff check .` mengatakan `No module named ...`

Biasanya ini terjadi karena Anda menjalankan **Python global**, bukan Python dari virtualenv proyek.

Solusi:

- jalankan `install.bat` dulu agar `.venv` dan tool dev terpasang
- masuk ke folder `backend`
- di **Windows CMD**, cukup jalankan:

```bat
python -m pytest
python -m ruff check .
```

Perintah itu akan diarahkan ke `backend\.venv\Scripts\python.exe` melalui `backend\python.bat`.

Di PowerShell atau Linux/macOS, gunakan interpreter virtualenv secara eksplisit.

### 4. Bingung urutan perintah instalasi dan menjalankan program

Untuk penggunaan normal, **jangan campur langkah manual dan otomatis**.

Pakai salah satu dari dua pola ini:

#### Pola paling mudah (disarankan)

- Windows CMD:
  1. `cd D:\comic_translator\automated-comic-translator`
  2. `install.bat`
  3. `run.bat`

- PowerShell:
  1. `cd D:\comic_translator\automated-comic-translator`
  2. `powershell -ExecutionPolicy Bypass -File .\install.ps1`
  3. `powershell -ExecutionPolicy Bypass -File .\run.ps1`

- Linux/macOS:
  1. `cd /path/to/automated-comic-translator`
  2. `./install.sh`
  3. `./run.sh`

#### Pola manual (kalau memang tidak ingin memakai installer)

1. buat virtualenv backend
2. install dependency backend
3. salin `.env`
4. install dependency extension
5. build extension
6. jalankan backend

Kalau Anda sudah memakai `install.bat` / `install.ps1` / `install.sh`, **tidak perlu lagi** melakukan langkah `copy`/`cp` kecuali memang ingin membuat ulang `.env` secara manual.

### 5. Build extension gagal karena `tsc` / `vite` tidak ditemukan

Jalankan:

```bash
cd extension
npm install
```

### 6. Teks vertikal tidak terbaca baik

Pastikan:

- `USE_ANGLE_CLS=true`
- `OCR_LANG` sesuai (`japan`, `korean`, atau `ch`)

### 7. Teks hasil render meluap dari bubble

Coba:

- kurangi `MAX_IMAGE_SIZE`
- gunakan font TTF/OTF yang lebih baik melalui `FONT_PATH`
- sesuaikan `MIN_FONT_SIZE`, `MAX_FONT_SIZE`, dan `STROKE_RATIO`

### 8. CORS / service worker bermasalah

- pastikan backend berjalan di `http://localhost:8000`
- pastikan extension punya `host_permissions` yang sesuai
- karena MV3 bisa meng-idle-kan service worker, semua setting harus tetap ada di `chrome.storage.local`

### 9. CUDA OOM / performa lambat

- gunakan `DEVICE=cpu` untuk fallback aman
- turunkan `MAX_IMAGE_SIZE`
- gunakan ONNX / quantized path bila tersedia

---

## Kontribusi

Saran workflow:

1. jalankan test backend
2. jalankan `ruff check .`
3. jalankan `npm run build` untuk extension
4. pertahankan lazy import untuk dependency ML berat
5. tambahkan test ketika mengubah logic pipeline

---

## Lisensi

MIT. Lihat file `../LICENSE` di root repository.
