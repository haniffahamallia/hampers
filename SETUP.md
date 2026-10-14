# Niffalla — Setup Order + Admin Panel

API URL sudah terpasang di `script.js` dan `admin.js`.

---

## A. Apps Script (wajib update)

1. Google Sheet order → **Extensions → Apps Script**
2. Hapus semua kode lama
3. Paste isi **`apps-script/Code.gs`** (versi 3.0 — ada admin CRUD)
4. **Save**
5. **Deploy → Manage deployments** → Edit (pensil) → **New version** → Deploy  
   Who has access: **Anyone**

### Script Properties (wajib untuk admin)

Project Settings (⚙️) → Script properties:

| Property | Value | Keterangan |
|----------|--------|------------|
| `ADMIN_PASSWORD` | `Bismillaah` | **Wajib** — password login panel admin |
| `ADMIN_EMAIL` | email@gmail.com | Opsional — notifikasi order baru |

**Cara cepat set password:**  
Di editor Apps Script, jalankan fungsi `setDefaultPassword` (Run ▶) sekali.  
Itu akan set `ADMIN_PASSWORD` = `Bismillaah`.

---

## B. File yang di-upload ke GitHub (root repo)

```
index.html
script.js
style.css
admin.html      ← BARU — panel admin
admin.js        ← BARU
admin.css       ← BARU
CNAME
site.webmanifest
favicon*
assets/
```

Jangan upload folder `apps-script/` dan `orphan/` ke GitHub Pages.

---

## C. Panel Admin

URL: **https://niffalla.my.id/admin.html**

| Fitur | Keterangan |
|-------|------------|
| Login | Password dari Script Properties (`ADMIN_PASSWORD`) |
| Lihat semua order | Tabel + statistik (Baru / Diproses / Selesai / Batal) |
| Cari & filter | Order ID, nama, WA, status |
| Edit | Status, nama, WA, total, catatan customer, catatan admin |
| Hapus | Hapus baris dari Sheet |
| Tambah manual | Buat order dari admin |

Password **tidak disimpan di website** — diverifikasi di server (Apps Script) setiap request.

---

## D. Test

1. Set `ADMIN_PASSWORD` = `Bismillaah` di Script Properties
2. Deploy New version Apps Script
3. Upload `admin.html`, `admin.js`, `admin.css` + update `Code.gs`
4. Buka `/admin.html` → login dengan `Bismillaah`
5. Harus muncul daftar order

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Password admin salah | Cek Script Properties `ADMIN_PASSWORD` (huruf besar/kecil harus sama) |
| Gagal memuat data | Deploy ulang New version, Who has access = Anyone |
| Mode demo di website | Pastikan `script.js` berisi URL API (bukan YOUR_DEPLOYMENT_ID) |
| API health | Buka URL `/exec` di browser → harus JSON `version: "3.0"` |
