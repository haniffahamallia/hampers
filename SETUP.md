# Niffalla Luxury Hampers — Setup Database Order

Paket ini berisi website siap deploy ke GitHub Pages + sistem database order memakai **Google Sheets + Apps Script** (100% gratis).

---

## Isi folder

```
niffalla-order-system/
├── website/                 ← Upload ke GitHub Pages
│   ├── index.html
│   ├── script.js            ← Ganti APPS_SCRIPT_URL di sini
│   ├── style.css
│   ├── assets/
│   └── ...
├── apps-script/
│   └── Code.gs              ← Paste ke Google Apps Script
└── SETUP.md                 ← File ini
```

---

## LANGKAH 1 — Buat Google Sheet (Database)

1. Buka [https://sheets.google.com](https://sheets.google.com)
2. Klik **Blank** (spreadsheet baru)
3. Rename file menjadi: `Niffalla Orders`
4. Rename sheet tab (bawah kiri) menjadi: **`Orders`**
5. Isi **baris 1** (header) dengan kolom berikut (copy-paste):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| timestamp | order_id | items | total | customer_name | customer_wa | note | source | status | admin_note |

Atau ketik manual:
```
timestamp	order_id	items	total	customer_name	customer_wa	note	source	status	admin_note
```

6. (Opsional) Format kolom:
   - Baris 1 → Bold + freeze (View → Freeze → 1 row)
   - Kolom `total` → Format number / currency

---

## LANGKAH 2 — Pasang Apps Script

1. Di Google Sheet yang sama, klik menu **Extensions → Apps Script**
2. Hapus kode default yang ada
3. Buka file `apps-script/Code.gs` dari paket ini, **copy semua isinya**, paste ke editor Apps Script
4. Klik **Save** (ikon disket) → beri nama project: `Niffalla Order API`
5. Pastikan timezone script = Asia/Jakarta:
   - Klik ⚙️ Project Settings (kiri)
   - Time zone → `(GMT+07:00) Bangkok, Hanoi, Jakarta`

---

## LANGKAH 3 — Deploy sebagai Web App

1. Di editor Apps Script, klik **Deploy → New deployment**
2. Klik ikon roda gigi di samping "Select type" → pilih **Web app**
3. Isi:
   - **Description**: `Niffalla Order API v1`
   - **Execute as**: `Me` (akun Google kamu)
   - **Who has access**: **`Anyone`** ← penting!
4. Klik **Deploy**
5. Akan muncul popup izin:
   - Klik **Authorize access**
   - Pilih akun Google kamu
   - Klik **Advanced** → **Go to Niffalla Order API (unsafe)** → **Allow**
6. Setelah berhasil, **copy URL** yang muncul (bentuknya seperti):
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec
   ```
   Simpan URL ini.

---

## LANGKAH 4 — Hubungkan ke Website

1. Buka file `website/script.js`
2. Cari baris ini di paling atas:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
3. Ganti dengan URL yang kamu copy di Langkah 3, contoh:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec";
   ```
4. Simpan file.

---

## LANGKAH 5 — Deploy Website ke GitHub Pages

### Opsi A — Repo sudah ada (update)

1. Ganti semua file di repo GitHub kamu dengan isi folder `website/`
2. Commit & push
3. Pastikan GitHub Pages aktif (Settings → Pages → Branch: main / root)

### Opsi B — Repo baru

1. Buat repo baru di GitHub (misal: `niffalla-hampers`)
2. Upload semua isi folder `website/` ke root repo
3. Settings → Pages → Source: Deploy from a branch → `main` → `/ (root)` → Save
4. Tunggu 1–2 menit, website hidup di `https://username.github.io/niffalla-hampers`
5. Kalau pakai custom domain (`niffalla.my.id`), isi file `CNAME` sudah ada.

---

## Cara kerja setelah live

1. Customer pilih produk → keranjang
2. Isi **Nama** + **Nomor WhatsApp** (+ catatan opsional)
3. Klik **Order via WhatsApp**
4. Sistem:
   - Kirim data ke Google Sheet (baris baru muncul di sheet `Orders`)
   - Dapat `order_id` (contoh: `NIF-20261013-001`)
   - Buka WhatsApp dengan pesan yang sudah berisi Order ID + detail
5. Kamu buka Google Sheet → lihat order baru (status: **Baru**)
6. Ubah status manual jadi `Diproses` / `Selesai` / `Batal` sesuai kebutuhan

---

## Testing

1. Buka website
2. Tambah 1 produk ke keranjang
3. Isi nama + nomor WA (boleh nomor sendiri)
4. Klik Order via WhatsApp
5. Cek:
   - Muncul notifikasi “Pesanan tercatat!”
   - WhatsApp terbuka dengan Order ID
   - Di Google Sheet muncul 1 baris baru

Kalau muncul pesan “Mode demo (API belum di-set)” → berarti URL di `script.js` belum diganti.

---

## Update kode Apps Script nanti

Setiap kali kamu ubah `Code.gs`:

1. Save
2. **Deploy → Manage deployments**
3. Klik ikon pensil (Edit) pada deployment aktif
4. Version → **New version**
5. Deploy

URL Web App **tetap sama**, tidak perlu ganti di website.

---

## Keamanan & catatan

- Siapa pun yang tahu URL Web App bisa kirim order (ini normal untuk form publik).
- Data tersimpan di Google Sheet milik akun kamu.
- Kuota gratis Google: sangat cukup untuk toko hampers (ribuan request/hari).
- Jangan share link edit Google Sheet ke publik. Cukup bagikan view-only kalau perlu.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| “Mode demo...” | Ganti `APPS_SCRIPT_URL` di `script.js` |
| Order tidak masuk Sheet | Pastikan Who has access = **Anyone**, dan sudah Authorize |
| CORS / network error | Deploy ulang dengan “Anyone”, pastikan pakai `text/plain` (sudah di kode) |
| Order ID dobel | Jarang terjadi; hapus baris test di Sheet lalu coba lagi |
| Nomor WA aneh di Sheet | Frontend sudah normalize 08xx → 62xx |

---

## Kontak / kustomisasi

Ingin tambah kolom (tanggal acara, alamat, dll)?  
Edit header di Sheet + baris `appendRow` di `Code.gs` + field form di `index.html` / `script.js`.

Selamat jualan! 🌸
