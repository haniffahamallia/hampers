# Niffalla Luxury Hampers

Landing page + sistem order database (Google Sheets + Apps Script).

## Setup lengkap

Baca **SETUP.md** di folder induk paket.

Langkah singkat:
1. Buat Google Sheet + pasang `apps-script/Code.gs`
2. Set Script Properties (`ADMIN_EMAIL`)
3. Deploy Web App → copy URL
4. Ganti `APPS_SCRIPT_URL` di `script.js`
5. Push folder ini ke GitHub Pages

## Fitur

- Keranjang belanja
- Form data pemesan (nama, WA, catatan)
- Order otomatis tercatat ke Google Sheet + Order ID
- Email notifikasi admin
- Checkout via WhatsApp (dengan Order ID)
- Honeypot anti-spam
- 100% gratis, tanpa secret di frontend
