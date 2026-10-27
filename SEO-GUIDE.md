# Panduan Lengkap SEO untuk Niffalla Luxury Hampers
**Website:** https://niffalla.my.id/  
**Repo:** https://github.com/haniffahamallia/hampers

Versi ini sudah dilengkapi file SEO dasar. Setelah deploy, ikuti langkah di bawah.

---

## 1. File yang sudah ditambahkan / diperbaiki

| File | Fungsi |
|------|--------|
| `robots.txt` | Memberitahu crawler apa yang boleh diindeks + lokasi sitemap |
| `sitemap.xml` | Daftar URL penting untuk Google/Bing |
| `index.html` | Meta title, description, robots, keywords, Open Graph, Twitter Card, JSON-LD (Schema.org) |
| `site.webmanifest` | PWA + icon lengkap |
| `humans.txt` | Info pemilik (opsional tapi bagus) |
| Favicon (semua size) | Sudah ada |
| `og-image.jpg` | Gambar share di WhatsApp/Facebook/Twitter |

---

## 2. Deploy ulang

1. Upload / push semua file di folder ini ke **root** repo GitHub (ganti yang lama).
2. Pastikan GitHub Pages aktif (Settings → Pages → Source: main / root).
3. Tunggu 1–5 menit, lalu cek:
   - https://niffalla.my.id/robots.txt
   - https://niffalla.my.id/sitemap.xml
   - https://niffalla.my.id/og-image.jpg

---

## 3. Langkah SEO setelah deploy (WAJIB)

### A. Google Search Console (paling penting)
1. Buka: https://search.google.com/search-console
2. Klik **Add property** → pilih **URL prefix** → masukkan `https://niffalla.my.id`
3. Verifikasi dengan salah satu metode:
   - **HTML tag** (paling mudah): copy meta tag yang diberikan, tempel di `<head>` index.html, deploy lagi, lalu verifikasi.
   - Atau **DNS** (TXT record di domain).
4. Setelah verified:
   - Klik **Sitemaps** di sidebar kiri → masukkan `sitemap.xml` → Submit.
   - Gunakan **URL Inspection** untuk request indexing halaman utama.

### B. Google Analytics / GA4 (opsional tapi sangat disarankan)
1. https://analytics.google.com/
2. Buat property GA4 untuk `niffalla.my.id`
3. Ambil Measurement ID (G-XXXXXXXX)
4. Tambahkan script di `index.html` (sebelum `</head>`):

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
```

### C. Bing Webmaster Tools
1. https://www.bing.com/webmasters
2. Add site → `https://niffalla.my.id`
3. Verifikasi (bisa pakai meta tag atau import dari Google Search Console)
4. Submit sitemap: `https://niffalla.my.id/sitemap.xml`

### D. Cek Open Graph & Share Preview
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
  - Masukkan `https://niffalla.my.id/` → Scrape Again
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

### E. Google Business Profile (jika punya lokasi fisik / melayani area tertentu)
1. https://business.google.com/
2. Buat profil bisnis "Niffalla Luxury Hampers"
3. Kategori: Gift Shop / Wedding Service / Online Store
4. Tambahkan website, WhatsApp, foto produk

### F. Schema / Rich Results Test
1. https://search.google.com/test/rich-results
2. Masukkan URL website → cek apakah Organization / Store terdeteksi.

---

## 4. Optimasi konten tambahan (setelah teknis selesai)

1. **Tambah halaman produk terpisah** (nanti)  
   Contoh: `/produk/wedding-premium-blue.html` agar bisa ranking keyword lebih spesifik.

2. **Alt text gambar**  
   Sudah ada di beberapa tempat. Pastikan semua `<img>` punya `alt` yang deskriptif.

3. **Internal linking**  
   Link antar section sudah bagus (#koleksi, #cara-order, dll).

4. **Kecepatan**  
   - Kompres gambar produk lebih lanjut (TinyPNG / Squoosh)
   - Pertimbangkan lazy loading (sudah di browser modern)

5. **Backlink & Sosial**  
   - Share di Instagram, TikTok, WhatsApp Status, Facebook
   - Minta review pelanggan di Google
   - Daftarkan di direktori lokal (Yellow Pages, dll)

---

## 5. Checklist cepat setelah deploy

- [ ] robots.txt bisa diakses
- [ ] sitemap.xml bisa diakses
- [ ] Google Search Console verified + sitemap submitted
- [ ] URL Inspection → Request indexing
- [ ] Facebook Debugger scrape ulang
- [ ] Cek title & description di hasil Google (setelah diindeks)
- [ ] WhatsApp preview gambar + teks sudah bagus

---

## 6. Link penting yang harus dikunjungi

| Platform | Link |
|----------|------|
| Google Search Console | https://search.google.com/search-console |
| Google Analytics | https://analytics.google.com |
| Bing Webmaster | https://www.bing.com/webmasters |
| Facebook Sharing Debugger | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | https://cards-dev.twitter.com/validator |
| Rich Results Test | https://search.google.com/test/rich-results |
| PageSpeed Insights | https://pagespeed.web.dev/ |
| Google Business Profile | https://business.google.com |

---

**Catatan:**  
Keyword utama yang bagus untuk target:  
`hampers pernikahan`, `seserahan soft blue`, `hampers wedding custom`, `gift hampers elegan`.

Setelah semua langkah di atas selesai, tunggu 3–14 hari untuk mulai muncul di Google.  
Kalau butuh bantuan lanjut (tambah halaman produk, blog, dll), bilang saja!
