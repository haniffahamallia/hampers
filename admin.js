/**
 * Niffalla Admin Panel
 * Password diverifikasi server-side via Script Properties (ADMIN_PASSWORD)
 */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzCDURAJjcJyTxBkCJVkvTA6ljyN7kz6zOk8qUWfxNoX1esOHIkFTAQpV74kSWT5LQc/exec";

const STORAGE_KEY = "niffalla_admin_pw";

let adminPassword = sessionStorage.getItem(STORAGE_KEY) || "";
let allOrders = [];
let mode = "edit"; // edit | create

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function rupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function toast(msg, type) {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast " + (type || "");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 2800);
}

async function api(payload) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(t);
    return await res.json();
  } catch (err) {
    clearTimeout(t);
    throw err;
  }
}

/* ——— Login ——— */
function showLogin() {
  $("#loginScreen").classList.remove("hidden");
  $("#dashboard").classList.add("hidden");
  adminPassword = "";
  sessionStorage.removeItem(STORAGE_KEY);
}

function showDashboard() {
  $("#loginScreen").classList.add("hidden");
  $("#dashboard").classList.remove("hidden");
  loadOrders();
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pw = $("#adminPassword").value;
  const btn = $("#loginBtn");
  const err = $("#loginError");
  err.textContent = "";
  btn.disabled = true;
  btn.textContent = "Memeriksa…";

  try {
    const data = await api({ action: "admin_login", password: pw });
    if (data && data.success) {
      adminPassword = pw;
      sessionStorage.setItem(STORAGE_KEY, pw);
      showDashboard();
    } else {
      err.textContent = (data && data.error) || "Password salah";
    }
  } catch (ex) {
    err.textContent = "Koneksi gagal. Cek deployment Apps Script.";
    console.error(ex);
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk";
  }
});

$("#btnLogout").addEventListener("click", showLogin);

/* ——— Load & render ——— */
async function loadOrders() {
  if (!adminPassword) return showLogin();

  $("#loadingState").classList.remove("hidden");
  $("#emptyState").classList.add("hidden");
  $("#ordersTable").classList.add("hidden");

  try {
    const data = await api({
      action: "list_orders",
      password: adminPassword,
      q: $("#searchInput").value.trim(),
      status_filter: $("#statusFilter").value,
    });

    if (!data.success) {
      if ((data.error || "").toLowerCase().includes("password")) {
        toast("Sesi berakhir. Login ulang.", "err");
        return showLogin();
      }
      toast(data.error || "Gagal memuat", "err");
      return;
    }

    allOrders = data.orders || [];
    renderStats(allOrders);
    renderTable(allOrders);
  } catch (ex) {
    console.error(ex);
    toast("Gagal memuat data", "err");
  } finally {
    $("#loadingState").classList.add("hidden");
  }
}

function renderStats(orders) {
  const c = { total: orders.length, Baru: 0, Diproses: 0, Selesai: 0, Batal: 0 };
  orders.forEach((o) => {
    if (c[o.status] !== undefined) c[o.status]++;
  });
  $("#statTotal").textContent = c.total;
  $("#statBaru").textContent = c.Baru;
  $("#statProses").textContent = c.Diproses;
  $("#statSelesai").textContent = c.Selesai;
  $("#statBatal").textContent = c.Batal;
}

function itemsSummary(items) {
  if (!items || !items.length) return "—";
  return items
    .map((it) => `${it.name || "?"} ×${it.qty || 1}`)
    .join(", ");
}

function renderTable(orders) {
  const tbody = $("#ordersBody");
  if (!orders.length) {
    $("#emptyState").classList.remove("hidden");
    $("#ordersTable").classList.add("hidden");
    return;
  }
  $("#emptyState").classList.add("hidden");
  $("#ordersTable").classList.remove("hidden");

  tbody.innerHTML = orders
    .map(
      (o) => `
    <tr data-row="${o.row}">
      <td><small>${escapeHtml(o.timestamp)}</small></td>
      <td class="order-id">${escapeHtml(o.order_id)}</td>
      <td>
        <div class="customer-name">${escapeHtml(o.customer_name)}</div>
        <div class="customer-wa">${escapeHtml(o.customer_wa)}</div>
      </td>
      <td class="items-cell">${escapeHtml(itemsSummary(o.items))}</td>
      <td class="total-cell">${rupiah(o.total)}</td>
      <td><span class="badge ${escapeHtml(o.status)}">${escapeHtml(o.status)}</span></td>
      <td class="actions-cell">
        <button type="button" data-edit="${o.row}">Edit</button>
        <button type="button" class="del" data-del="${o.row}">Hapus</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openEdit(Number(btn.dataset.edit)));
  });
  tbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => quickDelete(Number(btn.dataset.del)));
  });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ——— Modal ——— */
function openEdit(row) {
  const o = allOrders.find((x) => x.row === row);
  if (!o) return toast("Order tidak ditemukan", "err");

  mode = "edit";
  $("#modalTitle").textContent = "Edit Order";
  $("#fRow").value = o.row;
  $("#fOrderId").value = o.order_id;
  $("#fStatus").value = o.status || "Baru";
  $("#fName").value = o.customer_name;
  $("#fWa").value = o.customer_wa;
  $("#fTotal").value = o.total;
  $("#fNote").value = o.note;
  $("#fAdminNote").value = o.admin_note;
  $("#fItemsPreview").textContent =
    itemsSummary(o.items) + (o.note ? "\n\nCatatan: " + o.note : "");
  $("#btnDelete").hidden = false;
  $("#formMsg").textContent = "";
  $("#formMsg").className = "form-msg";
  $("#modal").classList.remove("hidden");
}

function openCreate() {
  mode = "create";
  $("#modalTitle").textContent = "Order Manual";
  $("#fRow").value = "";
  $("#fOrderId").value = "(otomatis)";
  $("#fStatus").value = "Baru";
  $("#fName").value = "";
  $("#fWa").value = "";
  $("#fTotal").value = "";
  $("#fNote").value = "";
  $("#fAdminNote").value = "";
  $("#fItemsPreview").textContent = "Items akan dicatat sebagai order manual dari admin.";
  $("#btnDelete").hidden = true;
  $("#formMsg").textContent = "";
  $("#formMsg").className = "form-msg";
  $("#modal").classList.remove("hidden");
  $("#fName").focus();
}

function closeModal() {
  $("#modal").classList.add("hidden");
}

$("#modalClose").addEventListener("click", closeModal);
$("#btnCancel").addEventListener("click", closeModal);
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) closeModal();
});

$("#orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#formMsg");
  const btn = $("#btnSave");
  btn.disabled = true;
  msg.textContent = "Menyimpan…";
  msg.className = "form-msg";

  try {
    let data;
    if (mode === "create") {
      data = await api({
        action: "create_order_admin",
        password: adminPassword,
        customer_name: $("#fName").value.trim(),
        customer_wa: $("#fWa").value.trim(),
        total: Number($("#fTotal").value) || 0,
        note: $("#fNote").value.trim(),
        admin_note: $("#fAdminNote").value.trim(),
        status: $("#fStatus").value,
        items: [
          {
            name: "Order Manual",
            qty: 1,
            price: Number($("#fTotal").value) || 0,
          },
        ],
      });
    } else {
      data = await api({
        action: "update_order",
        password: adminPassword,
        row: Number($("#fRow").value),
        status: $("#fStatus").value,
        customer_name: $("#fName").value.trim(),
        customer_wa: $("#fWa").value.trim(),
        total: Number($("#fTotal").value) || 0,
        note: $("#fNote").value.trim(),
        admin_note: $("#fAdminNote").value.trim(),
      });
    }

    if (data && data.success) {
      toast(data.message || "Tersimpan", "ok");
      closeModal();
      loadOrders();
    } else {
      msg.textContent = (data && data.error) || "Gagal menyimpan";
      msg.className = "form-msg err";
      if ((data.error || "").toLowerCase().includes("password")) showLogin();
    }
  } catch (ex) {
    msg.textContent = "Koneksi gagal";
    msg.className = "form-msg err";
  } finally {
    btn.disabled = false;
  }
});

$("#btnDelete").addEventListener("click", async () => {
  const row = Number($("#fRow").value);
  if (!row) return;
  if (!confirm("Hapus order ini secara permanen?")) return;

  try {
    const data = await api({
      action: "delete_order",
      password: adminPassword,
      row,
    });
    if (data && data.success) {
      toast("Order dihapus", "ok");
      closeModal();
      loadOrders();
    } else {
      toast((data && data.error) || "Gagal hapus", "err");
    }
  } catch (ex) {
    toast("Koneksi gagal", "err");
  }
});

async function quickDelete(row) {
  if (!confirm("Hapus order ini secara permanen?")) return;
  try {
    const data = await api({
      action: "delete_order",
      password: adminPassword,
      row,
    });
    if (data && data.success) {
      toast("Order dihapus", "ok");
      loadOrders();
    } else {
      toast((data && data.error) || "Gagal hapus", "err");
    }
  } catch (ex) {
    toast("Koneksi gagal", "err");
  }
}

/* ——— Toolbar ——— */
$("#btnRefresh").addEventListener("click", loadOrders);
$("#btnAdd").addEventListener("click", openCreate);

let searchTimer;
$("#searchInput").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadOrders, 350);
});
$("#statusFilter").addEventListener("change", loadOrders);

/* ——— Auto login jika session ada ——— */
(async function init() {
  if (adminPassword) {
    try {
      const data = await api({ action: "admin_login", password: adminPassword });
      if (data && data.success) {
        showDashboard();
        return;
      }
    } catch (e) {}
    sessionStorage.removeItem(STORAGE_KEY);
    adminPassword = "";
  }
  showLogin();
})();
