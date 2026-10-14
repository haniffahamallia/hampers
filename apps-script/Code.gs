/**
 * Niffalla Luxury Hampers — Order API v3
 * ======================================
 * Database : Google Sheets
 * Secrets  : Script Properties
 *
 * Script Properties:
 *   ADMIN_PASSWORD  = Bismillaah   (wajib untuk panel admin)
 *   ADMIN_EMAIL     = email@gmail.com  (opsional, notifikasi order)
 *   SPREADSHEET_ID  = (opsional)
 *
 * Deploy: Web app → Execute as Me → Who has access: Anyone
 */

var SHEET_NAME = "Orders";
var HEADER = [
  "timestamp",
  "order_id",
  "items",
  "total",
  "customer_name",
  "customer_wa",
  "note",
  "source",
  "status",
  "admin_note",
  "user_agent",
  "ip_hint"
];

function doGet(e) {
  return json_({
    ok: true,
    service: "Niffalla Order API",
    version: "3.0",
    time: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);
    var action = data.action || "";

    // ——— Public ———
    if (action === "create_order") {
      return handleCreateOrder_(data);
    }

    // ——— Admin (butuh password) ———
    if (action === "admin_login" || action === "list_orders" ||
        action === "update_order" || action === "delete_order" ||
        action === "create_order_admin") {
      if (!checkAdminPassword_(data.password)) {
        return json_({ success: false, error: "Password admin salah" });
      }
    } else {
      return json_({ success: false, error: "Unknown action" });
    }

    if (action === "admin_login") {
      return json_({ success: true, message: "Login berhasil" });
    }
    if (action === "list_orders") {
      return handleListOrders_(data);
    }
    if (action === "update_order") {
      return handleUpdateOrder_(data);
    }
    if (action === "delete_order") {
      return handleDeleteOrder_(data);
    }
    if (action === "create_order_admin") {
      return handleCreateOrderAdmin_(data);
    }

    return json_({ success: false, error: "Unknown action" });
  } catch (err) {
    return json_({ success: false, error: String(err.message || err) });
  }
}

/* ===================== AUTH ===================== */

function checkAdminPassword_(input) {
  var props = PropertiesService.getScriptProperties();
  var stored = props.getProperty("ADMIN_PASSWORD");
  if (!stored) {
    // Belum di-set → tolak semua admin action
    return false;
  }
  return String(input || "") === String(stored);
}

/* ===================== PUBLIC CREATE ===================== */

function handleCreateOrder_(data) {
  // Honeypot
  if (data.website && String(data.website).trim() !== "") {
    return json_({
      success: true,
      order_id: "NIF-SPAM-" + Date.now(),
      message: "Order diterima"
    });
  }

  var name = String(data.customer_name || "").trim();
  var wa = String(data.customer_wa || "").trim().replace(/\D/g, "");
  var items = data.items;

  if (!name || name.length < 2) {
    return json_({ success: false, error: "Nama tidak valid" });
  }
  if (!wa || wa.length < 10 || wa.length > 15) {
    return json_({ success: false, error: "Nomor WhatsApp tidak valid" });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return json_({ success: false, error: "Keranjang kosong" });
  }

  if (wa.charAt(0) === "0") wa = "62" + wa.slice(1);
  if (wa.charAt(0) === "8") wa = "62" + wa;

  var sheet = getOrdersSheet_();
  var lock = LockService.getScriptLock();
  lock.waitLock(8000);

  try {
    var orderId = generateOrderId_(sheet);
    var tz = Session.getScriptTimeZone() || "Asia/Jakarta";
    var timestamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
    var total = Number(data.total) || 0;
    var itemsJson = JSON.stringify(items);
    var note = String(data.note || "").trim().substring(0, 500);
    var source = String(data.source || "website").substring(0, 40);
    var ua = String(data.user_agent || "").substring(0, 200);
    var ipHint = String(data.ip_hint || "").substring(0, 60);

    sheet.appendRow([
      timestamp, orderId, itemsJson, total, name, wa,
      note, source, "Baru", "", ua, ipHint
    ]);

    sendAdminEmail_(orderId, name, wa, total, items, note, timestamp);

    return json_({
      success: true,
      order_id: orderId,
      timestamp: timestamp,
      message: "Order berhasil dicatat"
    });
  } finally {
    lock.releaseLock();
  }
}

/* ===================== ADMIN CRUD ===================== */

function handleListOrders_(data) {
  var sheet = getOrdersSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return json_({ success: true, orders: [], total: 0 });
  }

  var values = sheet.getRange(2, 1, lastRow - 1, HEADER.length).getValues();
  var orders = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var rowNum = i + 2; // 1-based sheet row
    var itemsRaw = row[2];
    var itemsParsed = [];
    try {
      itemsParsed = typeof itemsRaw === "string" ? JSON.parse(itemsRaw || "[]") : (itemsRaw || []);
    } catch (e) {
      itemsParsed = [{ name: String(itemsRaw), qty: 1, price: 0 }];
    }

    orders.push({
      row: rowNum,
      timestamp: formatCell_(row[0]),
      order_id: String(row[1] || ""),
      items: itemsParsed,
      items_raw: String(itemsRaw || ""),
      total: Number(row[3]) || 0,
      customer_name: String(row[4] || ""),
      customer_wa: String(row[5] || ""),
      note: String(row[6] || ""),
      source: String(row[7] || ""),
      status: String(row[8] || "Baru"),
      admin_note: String(row[9] || "")
    });
  }

  // Terbaru di atas
  orders.reverse();

  // Filter opsional
  var statusFilter = String(data.status_filter || "").trim();
  if (statusFilter) {
    orders = orders.filter(function (o) {
      return o.status.toLowerCase() === statusFilter.toLowerCase();
    });
  }
  var q = String(data.q || "").trim().toLowerCase();
  if (q) {
    orders = orders.filter(function (o) {
      return (
        o.order_id.toLowerCase().indexOf(q) !== -1 ||
        o.customer_name.toLowerCase().indexOf(q) !== -1 ||
        o.customer_wa.indexOf(q) !== -1 ||
        o.note.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  return json_({
    success: true,
    orders: orders,
    total: orders.length
  });
}

function handleUpdateOrder_(data) {
  var row = Number(data.row);
  if (!row || row < 2) {
    return json_({ success: false, error: "Row tidak valid" });
  }

  var sheet = getOrdersSheet_();
  if (row > sheet.getLastRow()) {
    return json_({ success: false, error: "Order tidak ditemukan" });
  }

  // Kolom: status (I=9), admin_note (J=10), optional name/wa/note/total
  if (data.status !== undefined && data.status !== null) {
    var st = String(data.status).trim();
    var allowed = ["Baru", "Diproses", "Selesai", "Batal"];
    if (allowed.indexOf(st) === -1) {
      return json_({ success: false, error: "Status tidak valid" });
    }
    sheet.getRange(row, 9).setValue(st);
  }
  if (data.admin_note !== undefined && data.admin_note !== null) {
    sheet.getRange(row, 10).setValue(String(data.admin_note).substring(0, 500));
  }
  if (data.customer_name !== undefined && data.customer_name !== null) {
    sheet.getRange(row, 5).setValue(String(data.customer_name).trim().substring(0, 100));
  }
  if (data.customer_wa !== undefined && data.customer_wa !== null) {
    sheet.getRange(row, 6).setValue(String(data.customer_wa).trim().substring(0, 20));
  }
  if (data.note !== undefined && data.note !== null) {
    sheet.getRange(row, 7).setValue(String(data.note).trim().substring(0, 500));
  }
  if (data.total !== undefined && data.total !== null) {
    sheet.getRange(row, 4).setValue(Number(data.total) || 0);
  }

  return json_({ success: true, message: "Order diupdate", row: row });
}

function handleDeleteOrder_(data) {
  var row = Number(data.row);
  if (!row || row < 2) {
    return json_({ success: false, error: "Row tidak valid" });
  }

  var sheet = getOrdersSheet_();
  if (row > sheet.getLastRow()) {
    return json_({ success: false, error: "Order tidak ditemukan" });
  }

  sheet.deleteRow(row);
  return json_({ success: true, message: "Order dihapus", row: row });
}

function handleCreateOrderAdmin_(data) {
  // Admin bisa buat order manual
  var name = String(data.customer_name || "").trim();
  var wa = String(data.customer_wa || "").trim().replace(/\D/g, "");
  var items = data.items || [];
  var total = Number(data.total) || 0;
  var note = String(data.note || "").trim().substring(0, 500);
  var status = String(data.status || "Baru").trim();

  if (!name) return json_({ success: false, error: "Nama wajib" });

  if (wa && wa.charAt(0) === "0") wa = "62" + wa.slice(1);
  if (wa && wa.charAt(0) === "8") wa = "62" + wa;

  var sheet = getOrdersSheet_();
  var lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    var orderId = generateOrderId_(sheet);
    var tz = Session.getScriptTimeZone() || "Asia/Jakarta";
    var timestamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
    var itemsJson = JSON.stringify(items);

    sheet.appendRow([
      timestamp, orderId, itemsJson, total, name, wa || "",
      note, "admin", status, String(data.admin_note || ""), "", ""
    ]);

    return json_({
      success: true,
      order_id: orderId,
      message: "Order manual dibuat"
    });
  } finally {
    lock.releaseLock();
  }
}

/* ===================== HELPERS ===================== */

function getOrdersSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty("SPREADSHEET_ID");
  var ss;

  if (ssId) {
    ss = SpreadsheetApp.openById(ssId);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("Spreadsheet tidak ditemukan. Set SPREADSHEET_ID di Script Properties.");
    }
  }

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADER);
    sheet.getRange(1, 1, 1, HEADER.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateOrderId_(sheet) {
  var tz = Session.getScriptTimeZone() || "Asia/Jakarta";
  var dateStr = Utilities.formatDate(new Date(), tz, "yyyyMMdd");
  var prefix = "NIF-" + dateStr + "-";

  var lastRow = sheet.getLastRow();
  var seq = 1;

  if (lastRow > 1) {
    var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
    var todayMax = 0;
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i] || "");
      if (id.indexOf(prefix) === 0) {
        var num = parseInt(id.split("-").pop(), 10) || 0;
        if (num > todayMax) todayMax = num;
      }
    }
    seq = todayMax + 1;
  }

  return prefix + ("000" + seq).slice(-3);
}

function formatCell_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  }
  return String(val || "");
}

function sendAdminEmail_(orderId, name, wa, total, items, note, timestamp) {
  var props = PropertiesService.getScriptProperties();
  var adminEmail = props.getProperty("ADMIN_EMAIL");
  if (!adminEmail) return;

  try {
    var lines = (items || []).map(function (it, i) {
      return (i + 1) + ". " + it.name + " × " + it.qty + " — Rp " + Number(it.price * it.qty).toLocaleString("id-ID");
    });

    var body =
      "Order baru masuk di Niffalla Luxury Hampers\n\n" +
      "Order ID   : " + orderId + "\n" +
      "Waktu      : " + timestamp + "\n" +
      "Nama       : " + name + "\n" +
      "WhatsApp   : " + wa + "\n" +
      "Total      : Rp " + Number(total).toLocaleString("id-ID") + "\n\n" +
      "Detail:\n" + lines.join("\n") + "\n\n" +
      (note ? "Catatan: " + note + "\n\n" : "") +
      "Panel admin: https://niffalla.my.id/admin.html";

    MailApp.sendEmail({
      to: adminEmail,
      subject: "[Niffalla] Order Baru " + orderId + " — " + name,
      body: body
    });
  } catch (e) {
    console.error("Email failed:", e);
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Jalankan sekali dari editor untuk set password default.
 * Run → setDefaultPassword → lalu cek log.
 */
function setDefaultPassword() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty("ADMIN_PASSWORD", "Bismillaah");
  Logger.log("ADMIN_PASSWORD set to Bismillaah");
  Logger.log("Current props: " + JSON.stringify(props.getProperties()));
}
