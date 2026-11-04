# Cara Pasang Fitur Baru Niffalla

File yang sudah di-enhance:
- `index.html`
- `style.css`
- `script.js`

## Langkah cepat

1. **Backup** dulu file lama di repo GitHub kamu (index.html, style.css, script.js).
2. Ganti ketiga file di atas dengan versi yang ada di folder ini.
3. Pastikan folder `assets/` (gambar hampers) tetap ada.
4. Commit & push ke GitHub → GitHub Pages akan update otomatis.

## Fitur yang ditambahkan

### 1. Selamat Datang (Welcome Overlay)
- Muncul sekali per sesi browser.
- Tombol "Masuk ke Website".
- Opsi centang: putar suara pembukaan.

### 2. Suara Pembukaan
- Chime elegan 3-nada (dibuat dengan Web Audio API, **tanpa file suara eksternal**).
- Tombol 🔊 di kiri bawah untuk mute/unmute kapan saja.
- Suara klik lembut saat interaksi (carousel, tambah keranjang).

### 3. Interactive Hero Section
- Parallax mouse (teks & elemen bergerak halus).
- Efek 3D tilt pada frame foto hampers.
- Particle soft blue mengambang.
- Shine effect pada gambar.

### 4. 3D Product Showcase
- Carousel 3D yang bisa digeser (panah / swipe / klik).
- Auto-rotate setiap 5 detik.
- Tombol "Tambah ke Keranjang" langsung dari showcase.

### 5. Special Promo Countdown
- Timer real-time (hari : jam : menit : detik).
- Saat ini diset berakhir **31 Desember 2026**.
- Ubah tanggal di `script.js` baris sekitar:
  ```js
  const PROMO_END = new Date(2026, 11, 31, 23, 59, 59);
  ```
  (bulan di JavaScript: 0 = Januari, 11 = Desember)

## Catatan

- Semua fitur lama (keranjang, order WhatsApp, Google Apps Script, search) **tetap utuh**.
- Tidak perlu library tambahan (pure CSS + JS).
- Mobile friendly.
