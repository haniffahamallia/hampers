# Niffalla — Setup Order Database (Google Sheets + Apps Script)

**API URL sudah di-set** di `script.js`. Kamu tinggal pastikan Apps Script-nya aktif.

---

## YANG HARUS KAMU LAKUKAN SEKARANG (urutan wajib)

### A. Pastikan kode Apps Script terbaru & deployment aktif

1. Buka Google Sheet order kamu
2. **Extensions → Apps Script**
3. **Hapus semua kode** yang ada di editor
4. Buka file `apps-script/Code.gs` dari paket ini → **copy semua** → paste di editor
5. Klik **Save** (Ctrl+S)
6. Klik **Deploy → Manage deployments**
7. Kalau sudah ada deployment:
   - Klik ikon **pensil** (Edit)
   - Version → pilih **New version**
   - Who has access: pastikan **Anyone**
   - Klik **Deploy**
8. Kalau belum ada deployment:
   - **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy → Authorize (Advanced → Go to … → Allow)
9. URL Web App kamu:
   ```
   https://script.google.com/macros/s/AKfycbzCDURAJjcJyTxBkCJVkvTA6ljyN7kz6zOk8qUWfxNoX1esOHIkFTAQpV74kSWT5LQc/exec
   ```
   (sudah terpasang di `script.js`)

### B. (Opsional tapi recommended) Set email notifikasi

1. Di Apps Script editor → ikon ⚙️ **Project Settings**
2. Scroll ke **Script properties** → Add script property
3. Property: `ADMIN_EMAIL`  
   Value: email Gmail kamu (contoh `nama@gmail.com`)
4. Save

### C. Upload ke GitHub

1. Extract zip ini
2. Isi **root repo** GitHub kamu dengan file-file website (bukan folder di dalamnya):
   ```
   index.html
   script.js          ← sudah berisi API URL kamu
   style.css
   CNAME
   site.webmanifest
   favicon*
   assets/
   ```
3. Folder `apps-script/` dan `orphan/` **tidak perlu** di-upload ke GitHub Pages (boleh disimpan di komputer saja)
4. Commit & push
5. Tunggu 1 menit → hard refresh website (`Ctrl + Shift + R`)

### D. Test

1. Buka https://niffalla.my.id
2. Tambah 1 produk ke keranjang
3. Isi nama + nomor WA sendiri
4. Klik **Order via WhatsApp**
5. Harus muncul: **Pesanan tercatat! Order ID: NIF-...**
6. Cek Google Sheet → baris baru muncul
7. WhatsApp terbuka dengan Order ID

---

## Troubleshooting

| Pesan | Artinya | Solusi |
|-------|---------|--------|
| Mode demo (API belum di-set) | `script.js` masih placeholder | Pastikan file `script.js` dari zip ini yang di-upload (bukan yang lama) |
| Koneksi database gagal | Deployment belum "Anyone" / belum New version | Ulangi langkah A poin 6–8 |
| Order tidak masuk Sheet | Authorization belum / sheet name salah | Pastikan sheet tab bernama `Orders`, Authorize ulang |
| Email tidak masuk | Belum set ADMIN_EMAIL | Langkah B |

### Cara cek API hidup

Buka di browser:
```
https://script.google.com/macros/s/AKfycbzCDURAJjcJyTxBkCJVkvTA6ljyN7kz6zOk8qUWfxNoX1esOHIkFTAQpV74kSWT5LQc/exec
```
Harus muncul JSON seperti:
```json
{"ok":true,"service":"Niffalla Order API","version":"2.0",...}
```

Kalau muncul error / blank → deployment belum benar (ulangi langkah A).

---

## Struktur paket ini

```
niffalla-ready/
├── index.html, script.js, style.css, assets/, CNAME, favicon*   ← UPLOAD KE GITHUB
├── apps-script/Code.gs                                          ← PASTE KE APPS SCRIPT
├── orphan/                                                      ← file lama/tidak terpakai (simpan di komputer)
└── SETUP.md
```

File di folder `orphan/` tidak dipakai website. Boleh dihapus dari repo GitHub agar repo lebih ringan.
