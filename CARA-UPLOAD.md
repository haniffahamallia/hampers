# Open Graph / Thumbnail Share — Niffalla

## File yang di-upload ke root repo GitHub

1. `index.html`  (sudah berisi meta og:image & twitter:card)
2. `og-image.jpg` (gambar 1200×630 untuk thumbnail)

Upload ke: https://github.com/haniffahamallia/hampers  
(root repo, sama seperti file index.html yang sekarang)

## Setelah push

1. Tunggu GitHub Pages update (±1 menit)
2. Buka https://niffalla.my.id/og-image.jpg → pastikan gambar muncul
3. **Clear cache WhatsApp / Facebook** (penting!):
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Masukkan: `https://niffalla.my.id/`
   - Klik **Scrape Again** / **Debug** beberapa kali
4. Untuk WhatsApp: setelah scrape Facebook, kirim link di chat baru (WA pakai cache Facebook)

## Thumbnail GitHub repo

Link `https://github.com/haniffahamallia/hampers` memakai **Social preview** repo:
Settings → General → Social preview → Upload `og-image.jpg`

Itu terpisah dari website; OG tags hanya berlaku untuk link website.
