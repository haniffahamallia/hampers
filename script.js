/**
 * Niffalla Luxury Hampers — Enhanced Frontend
 * Features: Welcome overlay + sound, Interactive Hero, 3D Showcase, Promo Countdown
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzCDURAJjcJyTxBkCJVkvTA6ljyN7kz6zOk8qUWfxNoX1esOHIkFTAQpV74kSWT5LQc/exec";

const WA_NUMBER = "6285159977358";
const WA_TEMPLATE = "Halo kak, saya mau order hampers.";

/* ===== PROMO COUNTDOWN TARGET =====
   Ganti tanggal ini sesuai periode promo kamu.
   Format: year, monthIndex (0=Jan), day, hour, minute
*/
const PROMO_END = new Date(2026, 11, 31, 23, 59, 59); // 31 Des 2026

let cart = [];
let soundEnabled = true;
let audioCtx = null;

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

/* ========== SOUND (Web Audio API — elegan, tanpa file eksternal) ========== */
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playChime() {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudio();
    const now = ctx.currentTime;

    // Soft elegant 3-note chime (C5 - E5 - G5 style, soft blue feel)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = 2000;

      gain.gain.setValueAtTime(0, now + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 1.5);
    });

    // Soft pad underneath
    const pad = ctx.createOscillator();
    const padGain = ctx.createGain();
    pad.type = "sine";
    pad.frequency.value = 261.63;
    padGain.gain.setValueAtTime(0, now);
    padGain.gain.linearRampToValueAtTime(0.04, now + 0.3);
    padGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    pad.connect(padGain);
    padGain.connect(ctx.destination);
    pad.start(now);
    pad.stop(now + 2.3);
  } catch (e) {
    console.warn("Audio not available:", e);
  }
}

function playSoftClick() {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (_) {}
}

/* ========== WELCOME OVERLAY ========== */
function initWelcome() {
  const overlayEl = $("#welcomeOverlay");
  const enterBtn = $("#welcomeEnter");
  const soundCheck = $("#welcomeSoundCheck");
  const soundToggle = $("#soundToggle");

  // Already visited this session?
  if (sessionStorage.getItem("niffalla_welcomed") === "1") {
    overlayEl.classList.add("hide");
    overlayEl.setAttribute("aria-hidden", "true");
    return;
  }

  enterBtn.addEventListener("click", () => {
    soundEnabled = soundCheck.checked;
    if (soundEnabled) playChime();
    sessionStorage.setItem("niffalla_welcomed", "1");
    overlayEl.classList.add("hide");
    overlayEl.setAttribute("aria-hidden", "true");
    updateSoundToggleUI();
  });

  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    updateSoundToggleUI();
    if (soundEnabled) playSoftClick();
  });

  function updateSoundToggleUI() {
    soundToggle.classList.toggle("muted", !soundEnabled);
  }
  updateSoundToggleUI();
}

/* ========== INTERACTIVE HERO (parallax + 3D tilt + particles) ========== */
function initInteractiveHero() {
  const hero = $("#heroInteractive");
  const frame = $("#heroFrame");
  if (!hero || !frame) return;

  // Particles
  const particlesWrap = $("#heroParticles");
  if (particlesWrap) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      p.className = "hero-particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 8 + Math.random() * 12 + "s";
      p.style.animationDelay = Math.random() * 8 + "s";
      p.style.width = p.style.height = 3 + Math.random() * 5 + "px";
      particlesWrap.appendChild(p);
    }
  }

  // Mouse parallax + 3D tilt
  let ticking = false;
  hero.addEventListener("mousemove", (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Parallax layers
      $$("[data-parallax]").forEach((el) => {
        const depth = parseFloat(el.dataset.parallax) || 0.05;
        el.style.transform = `translate(${x * depth * -80}px, ${y * depth * -60}px)`;
      });

      // 3D tilt on hero frame
      const rotY = x * 12;
      const rotX = -y * 10;
      frame.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`;

      ticking = false;
    });
  });

  hero.addEventListener("mouseleave", () => {
    $$("[data-parallax]").forEach((el) => {
      el.style.transform = "";
    });
    frame.style.transform = "";
  });

  // Touch support for mobile
  hero.addEventListener("touchmove", (e) => {
    if (!e.touches[0]) return;
    const t = e.touches[0];
    const rect = hero.getBoundingClientRect();
    const x = (t.clientX - rect.left) / rect.width - 0.5;
    const y = (t.clientY - rect.top) / rect.height - 0.5;
    const rotY = x * 8;
    const rotX = -y * 6;
    frame.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }, { passive: true });
}

/* ========== PRODUCT CARD 3D TILT ========== */
function initCardTilt() {
  $$(".tilt-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* ========== 3D PRODUCT SHOWCASE CAROUSEL ========== */
function initShowcase3D() {
  const items = $$(".showcase-item");
  const dotsWrap = $("#showcaseDots");
  const prevBtn = $("#showcasePrev");
  const nextBtn = $("#showcaseNext");
  const addBtn = $("#showcaseAdd");
  if (!items.length) return;

  let current = 0;
  const total = items.length;

  // Build dots
  items.forEach((_, i) => {
    const d = document.createElement("button");
    d.setAttribute("aria-label", `Produk ${i + 1}`);
    if (i === 0) d.classList.add("active");
    d.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(d);
  });

  function layout() {
    items.forEach((item, i) => {
      const diff = i - current;
      // Normalize to -2..2 range for circular feel
      let offset = diff;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const abs = Math.abs(offset);
      const z = 200 - abs * 80;
      const x = offset * 160;
      const scale = 1 - abs * 0.18;
      const rotY = offset * -28;
      const opacity = abs > 2 ? 0 : 1 - abs * 0.32;

      item.classList.toggle("active", i === current);
      item.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
      item.style.opacity = opacity;
      item.style.zIndex = String(10 - abs);
      item.style.pointerEvents = abs > 1.5 ? "none" : "auto";
    });

    $$("#showcaseDots button").forEach((d, i) => {
      d.classList.toggle("active", i === current);
    });

    // Update add button data
    const active = items[current];
    if (active && addBtn) {
      addBtn.dataset.product = active.dataset.product;
      addBtn.dataset.price = active.dataset.price;
    }
  }

  function goTo(index) {
    current = ((index % total) + total) % total;
    layout();
    playSoftClick();
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const idx = Number(item.dataset.index);
      if (idx !== current) goTo(idx);
    });
  });

  // Drag / swipe support
  let startX = 0;
  let dragging = false;
  const stage = $(".showcase-stage");
  stage.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    dragging = true;
  });
  stage.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goTo(current + 1);
      else goTo(current - 1);
    }
  });

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const name = addBtn.dataset.product;
      const price = Number(addBtn.dataset.price);
      if (!name) return;
      const existing = cart.find((x) => x.name === name);
      if (existing) existing.qty++;
      else cart.push({ name, price, qty: 1 });
      renderCart();
      openCart();
      playSoftClick();
    });
  }

  layout();
  // Auto-rotate gently every 5s (pause on interaction handled by goTo)
  setInterval(() => {
    if (!document.hidden) goTo(current + 1);
  }, 5500);
}

/* ========== PROMO COUNTDOWN ========== */
function initCountdown() {
  const daysEl = $("#cdDays");
  const hoursEl = $("#cdHours");
  const minsEl = $("#cdMins");
  const secsEl = $("#cdSecs");
  const noteEl = $("#countdownNote");
  if (!daysEl) return;

  function tick() {
    const now = new Date();
    let diff = PROMO_END - now;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      if (noteEl) noteEl.textContent = "Promo telah berakhir — tetap bisa order via WhatsApp ya!";
      return;
    }

    const d = Math.floor(diff / 86400000);
    diff %= 86400000;
    const h = Math.floor(diff / 3600000);
    diff %= 3600000;
    const m = Math.floor(diff / 60000);
    diff %= 60000;
    const s = Math.floor(diff / 1000);

    daysEl.textContent = String(d).padStart(2, "0");
    hoursEl.textContent = String(h).padStart(2, "0");
    minsEl.textContent = String(m).padStart(2, "0");
    secsEl.textContent = String(s).padStart(2, "0");
  }

  tick();
  setInterval(tick, 1000);
}

/* ========== CART (original logic kept) ========== */
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
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
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
  }

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

/* ========== EVENT LISTENERS ========== */
$$(".add-cart").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.product;
    const price = Number(btn.dataset.price);
    const existing = cart.find((x) => x.name === name);
    if (existing) existing.qty++;
    else cart.push({ name, price, qty: 1 });
    renderCart();
    openCart();
    playSoftClick();
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", () => {
  initWelcome();
  initInteractiveHero();
  initCardTilt();
  initShowcase3D();
  initCountdown();
  renderCart();
});
