# Niffalla Luxury Hampers — Setup Order Database

Website GitHub Pages + **Google Sheets + Apps Script** (100% gratis).

Tidak ada secret di frontend. Semua konfigurasi sensitif disimpan di **Script Properties** Apps Script.

---

## Struktur paket

```
niffalla-hampers-order/
├── website/                 ← Upload ke GitHub Pages (root repo)
│   ├── index.html
│   ├── script.js            ← Ganti APPS_SCRIPT_URL di sini saja
│   ├── style.css
│   ├── assets/
│   ├── CNAME
│   └── favicon*
├── apps-script/
│   └── Code.gs              ← Paste ke Google Apps Script
└── SETUP.md                 ← File ini
```

---

## Analisis UI/UX & Fitur yang dipilih

| Fitur | Alasan UI/UX |
|-------|--------------|
| **Keranjang + form di drawer** | Customer tidak perlu pindah halaman. Flow singkat: pilih → isi data → WhatsApp. |
| **Order ID otomatis** | Admin mudah lacak, customer punya referensi di chat. Format `NIF-YYYYMMDD-XXX`. |
| **Simpan ke Google Sheet** | Admin lihat order real-time, ubah status manual (`Baru` → `Diproses` → `Selesai`). |
| **Email notifikasi** | Admin langsung tahu ada order baru (pakai Script Properties `ADMIN_EMAIL`). |
| **Honeypot anti-spam** | Field tersembunyi menolak bot tanpa CAPTCHA yang mengganggu UX. |
| **Fallback WhatsApp** | Kalau API gagal, order tetap terkirim via WA — tidak ada lost sale. |
| **Produk tetap di HTML** | Load super cepat (static GH Pages). Tidak ada extra request ke Sheet saat buka halaman. |
| **Tidak ada secret di GitHub** | Hanya URL Web App (public by design). Email, spreadsheet ID, dll di Script Properties. |

Fitur yang **sengaja tidak** ditambahkan (agar tetap ringan & gratis):
- Login admin di website (lebih aman lewat Sheet langsung)
- Payment gateway (bisa ditambah nanti)
- Dynamic product dari Sheet (bisa, tapi menambah latency & kompleksitas)

---

## LANGKAH 1 — Buat Google Sheet

1. Buka [sheets.google.com](https://sheets.google.com) → **Blank**
2. Rename file: `Niffalla Orders`
3. Rename tab sheet: **`Orders`**
4. Isi **baris 1** (header) dengan:

```
timestamp	order_id	items	total	customer_name	customer_wa	note	source	status	admin_note	user_agent	ip_hint
```

Atau biarkan kosong — script akan membuat header otomatis saat order pertama masuk.

5. (Opsional) Freeze baris 1: View → Freeze → 1 row

---

## LANGKAH 2 — Pasang Apps Script

1. Di Google Sheet yang sama: **Extensions → Apps Script**
2. Hapus kode default
3. Copy seluruh isi `apps-script/Code.gs` → paste
4. **Save** → nama project: `Niffalla Order API`
5. Time zone: Project Settings (⚙️) → Time zone → `(GMT+07:00) Bangkok, Hanoi, Jakarta`

---

## LANGKAH 3 — Script Properties (penting)

1. Di editor Apps Script klik ⚙️ **Project Settings**
2. Scroll ke **Script properties** → **Add script property**

| Property      | Value                          | Keterangan                          |
|---------------|--------------------------------|-------------------------------------|
| `ADMIN_EMAIL` | `emailkamu@gmail.com`          | Notifikasi order baru (wajib isi)   |
| `SPREADSHEET_ID` | (opsional) ID dari URL sheet | Hanya jika script tidak terikat sheet |

**Cara cepat (opsional):**  
Jalankan fungsi `setProperties()` sekali dari editor (ganti email di dalam fungsi dulu), lalu hapus/comment fungsi tersebut.

---

## LANGKAH 4 — Deploy Web App

1. **Deploy → New deployment**
2. Type: **Web app**
3. Description: `Niffalla Order API v2`
4. Execute as: **Me**
5. Who has access: **Anyone** ← wajib
6. **Deploy** → Authorize (Advanced → Go to … (unsafe) → Allow)
7. **Copy URL** yang muncul:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec
   ```

---

## LANGKAH 5 — Hubungkan ke Website

1. Buka `website/script.js`
2. Ganti baris ini:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
   dengan URL yang kamu copy.
3. Simpan.

---

## LANGKAH 6 — Deploy ke GitHub Pages

### Update repo yang sudah ada
1. Ganti semua file di root repo dengan isi folder `website/`
2. Commit & push
3. Pastikan Pages aktif (Settings → Pages → Branch `main` / root)

### Repo baru
1. Buat repo → upload isi `website/`
2. Settings → Pages → Deploy from branch `main` → `/ (root)`
3. Custom domain `niffalla.my.id` → file `CNAME` sudah ada

---

## Cara kerja setelah live

1. Customer pilih produk → keranjang
2. Isi **Nama** + **Nomor WA** (+ catatan opsional)
3. Klik **Order via WhatsApp**
4. Sistem:
   - Kirim data ke Google Sheet (baris baru, status `Baru`)
   - Generate `order_id` (contoh `NIF-20261014-001`)
   - Kirim email notifikasi ke `ADMIN_EMAIL`
   - Buka WhatsApp dengan pesan lengkap + Order ID
5. Kamu buka Sheet → ubah status jadi `Diproses` / `Selesai` / `Batal`

---

## Testing

1. Buka website
2. Tambah 1 produk → isi nama + WA sendiri
3. Klik Order via WhatsApp
4. Cek:
   - Notifikasi “Pesanan tercatat! Order ID: …”
   - WhatsApp terbuka dengan Order ID
   - Baris baru muncul di Sheet
   - Email masuk ke inbox admin

Kalau muncul “Mode demo (API belum di-set)” → URL di `script.js` belum diganti.

---

## Update kode Apps Script nanti

Setiap ubah `Code.gs`:
1. Save
2. **Deploy → Manage deployments** → Edit (pensil)
3. Version → **New version** → Deploy  
URL tetap sama, tidak perlu ganti di website.

---

## Keamanan & performa

- URL Web App bersifat publik (normal untuk form order).
- Tidak ada API key / password di GitHub Pages.
- Honeypot menolak bot sederhana.
- LockService mencegah Order ID bentrok saat concurrent.
- Timeout 12 detik di frontend + fallback WhatsApp.
- Kuota gratis Google sangat cukup untuk toko hampers.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Mode demo… | Ganti `APPS_SCRIPT_URL` di `script.js` |
| Order tidak masuk Sheet | Who has access = **Anyone**, sudah Authorize |
| Email tidak masuk | Cek `ADMIN_EMAIL` di Script Properties + spam folder |
| CORS / network error | Deploy ulang “Anyone”, Content-Type sudah `text/plain` |
| Order ID dobel | Sangat jarang (ada LockService); hapus baris test lalu coba lagi |

---

Selamat jualan! 🌸
