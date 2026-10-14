/**
 * Niffalla Luxury Hampers — Frontend
 * Order → Google Apps Script → Sheets
 *
 * Hanya ganti APPS_SCRIPT_URL setelah deploy Web App.
 * Tidak ada secret di sini (aman untuk GitHub Pages).
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

const WA_NUMBER = "6285159977358";
const WA_TEMPLATE = "Halo kak, saya mau order hampers.";

let cart = [];

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const cartDrawer = $("#cartDrawer");
const overlay = $("#overlay");
const cartCount = $("#cartCount");
const cartItems = $("#cartItems");
const cartTotal = $("#cartTotal");
const checkoutBtn = $("#checkoutBtn");
const orderStatus = $("#orderStatus");
const formError = $("#formError");
const formSuccess = $("#formSuccess");

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = count;

  if (!cart.length) {
    cartItems.innerHTML =
      '<p class="cart-empty">Keranjang masih kosong.<br>Pilih hampers favoritmu dulu ✦</p>';
    cartTotal.textContent = "Rp 0";
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item, i) => `
    <div class="cart-row">
      <div>
        <p>${escapeHtml(item.name)}</p>
        <small>${rupiah(item.price)} × ${item.qty}</small>
        <button class="remove-item" data-remove="${i}" type="button">Hapus</button>
      </div>
      <strong>${rupiah(item.price * item.qty)}</strong>
    </div>`
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotal.textContent = rupiah(total);

  $$("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => {
      cart.splice(Number(btn.dataset.remove), 1);
      renderCart();
    })
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showStatus(msg, type) {
  orderStatus.textContent = msg;
  orderStatus.className = "order-status show " + type;
  formError.classList.remove("show");
  formSuccess.classList.remove("show");
}

function clearStatus() {
  orderStatus.className = "order-status";
  orderStatus.textContent = "";
  formError.classList.remove("show");
  formSuccess.classList.remove("show");
}

function normalizeWa(raw) {
  let n = String(raw || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8") && n.length >= 10) n = "62" + n;
  return n;
}

function validateForm() {
  const name = $("#customerName").value.trim();
  const wa = $("#customerWa").value.trim();
  const waNorm = normalizeWa(wa);

  if (!name || name.length < 2) {
    formError.textContent = "Mohon isi nama lengkap.";
    formError.classList.add("show");
    return null;
  }
  if (!wa || waNorm.length < 11 || waNorm.length > 15 || !waNorm.startsWith("62")) {
    formError.textContent = "Nomor WhatsApp tidak valid. Contoh: 081234567890";
    formError.classList.add("show");
    return null;
  }
  formError.classList.remove("show");
  return {
    customer_name: name,
    customer_wa: waNorm,
    note: $("#customerNote").value.trim(),
  };
}

function buildWaMessage(orderId, formData, total) {
  const lines = cart.map(
    (x, i) =>
      `${i + 1}. ${x.name} — ${x.qty} packet (${rupiah(x.price * x.qty)})`
  );

  let text = `${WA_TEMPLATE}\n\n`;
  text += `Order ID: ${orderId}\n`;
  text += `Nama: ${formData.customer_name}\n`;
  text += `WA: ${formData.customer_wa}\n\n`;
  text += `Detail pesanan:\n${lines.join("\n")}\n\n`;
  text += `Total: ${rupiah(total)}\n`;
  if (formData.note) text += `\nCatatan: ${formData.note}\n`;
  text += `\nMohon info ketersediaan dan detail customnya ya kak.`;
  return text;
}

async function submitOrder() {
  clearStatus();

  if (!cart.length) {
    alert("Keranjang masih kosong. Silakan pilih hampers terlebih dahulu.");
    return;
  }

  const formData = validateForm();
  if (!formData) return;

  const total = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
  const payload = {
    action: "create_order",
    items: cart.map((x) => ({
      name: x.name,
      qty: x.qty,
      price: x.price,
    })),
    total: total,
    customer_name: formData.customer_name,
    customer_wa: formData.customer_wa,
    note: formData.note,
    source: "website",
    // Honeypot (harus kosong)
    website: ($("#hpWebsite") && $("#hpWebsite").value) || "",
    user_agent: navigator.userAgent || "",
  };

  checkoutBtn.classList.add("loading");
  checkoutBtn.disabled = true;
  showStatus("Sedang mencatat pesanan...", "ok");

  let orderId = "LOCAL-" + Date.now().toString(36).toUpperCase();
  let saved = false;

  const isConfigured =
    APPS_SCRIPT_URL &&
    !APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID");

  if (isConfigured) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        // text/plain menghindari preflight CORS yang ribet di Apps Script
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data && data.success) {
        orderId = data.order_id || orderId;
        saved = true;
        showStatus(`Pesanan tercatat! Order ID: ${orderId}`, "ok");
        formSuccess.textContent = `Berhasil! Order ID: ${orderId}`;
        formSuccess.classList.add("show");
      } else {
        showStatus(
          (data && data.error) || "Gagal mencatat ke database. Tetap buka WhatsApp ya.",
          "err"
        );
      }
    } catch (err) {
      console.error("Order save error:", err);
      const msg =
        err.name === "AbortError"
          ? "Timeout koneksi. Pesanan tetap dikirim via WhatsApp."
          : "Koneksi database gagal. Pesanan tetap dikirim via WhatsApp.";
      showStatus(msg, "err");
    }
  } else {
    showStatus(
      "Mode demo (API belum di-set). Pesanan dikirim via WhatsApp saja.",
      "err"
    );
    console.warn(
      "Ganti APPS_SCRIPT_URL di script.js dengan URL Web App dari Apps Script."
    );
  }

  // Selalu buka WhatsApp (fallback aman)
  const text = buildWaMessage(orderId, formData, total);
  window.open(
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`,
    "_blank"
  );

  checkoutBtn.classList.remove("loading");
  checkoutBtn.disabled = false;

  if (saved) {
    setTimeout(() => {
      cart = [];
      renderCart();
      $("#customerName").value = "";
      $("#customerWa").value = "";
      $("#customerNote").value = "";
      if ($("#hpWebsite")) $("#hpWebsite").value = "";
      clearStatus();
    }, 2800);
  }
}

// ——— Event listeners ———
$$(".add-cart").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.product;
    const price = Number(btn.dataset.price);
    const existing = cart.find((x) => x.name === name);
    if (existing) existing.qty++;
    else cart.push({ name, price, qty: 1 });
    renderCart();
    openCart();
  });
});

$("#cartToggle").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
checkoutBtn.addEventListener("click", submitOrder);

const searchPanel = $("#searchPanel");
$("#searchToggle").addEventListener("click", () => {
  searchPanel.classList.toggle("open");
  if (searchPanel.classList.contains("open")) $("#searchInput").focus();
});
$("#searchClose").addEventListener("click", () =>
  searchPanel.classList.remove("open")
);

$("#searchInput").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  let visible = 0;
  $$(".product-card").forEach((card) => {
    const text = (card.dataset.name + " " + card.dataset.category).toLowerCase();
    const show = !q || text.includes(q);
    card.style.display = show ? "" : "none";
    if (show) visible++;
  });
  const empty = $("#emptyState");
  if (empty) empty.style.display = visible ? "none" : "block";
});

$("#menuBtn").addEventListener("click", () =>
  $("#nav").classList.toggle("open")
);
$$(".nav a").forEach((a) =>
  a.addEventListener("click", () => $("#nav").classList.remove("open"))
);

// Tutup cart dengan Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

renderCart();
