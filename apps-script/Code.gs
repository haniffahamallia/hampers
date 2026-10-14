/**
 * Niffalla Luxury Hampers — Order API (Google Apps Script)
 * ========================================================
 * Database: Google Sheets
 * Secrets:  Script Properties (Project Settings → Script properties)
 *
 * Script Properties yang disarankan:
 *   ADMIN_EMAIL     = email kamu (untuk notifikasi order baru)
 *   SPREADSHEET_ID  = (opsional) ID spreadsheet jika script tidak terikat sheet
 *   HONEYPOT_KEY    = (opsional) nilai honeypot yang dianggap spam, default "website"
 *
 * Deploy:
 *   Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
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

/**
 * GET — health check / testing
 */
function doGet(e) {
  return json_({
    ok: true,
    service: "Niffalla Order API",
    version: "2.0",
    time: new Date().toISOString()
  });
}

/**
 * POST — create_order
 * Body: text/plain JSON
 */
function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);

    if (data.action !== "create_order") {
      return json_({ success: false, error: "Unknown action" });
    }

    // Honeypot: field "website" harus kosong (bot biasanya isi)
    if (data.website && String(data.website).trim() !== "") {
      // Silent success untuk bot (jangan kasih tau kena spam filter)
      return json_({
        success: true,
        order_id: "NIF-SPAM-" + Date.now(),
        message: "Order diterima"
      });
    }

    // Validasi
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

    // Normalize WA ke 62…
    if (wa.charAt(0) === "0") wa = "62" + wa.slice(1);
    if (wa.charAt(0) === "8") wa = "62" + wa;

    var sheet = getOrdersSheet_();
    var lock = LockService.getScriptLock();
    lock.waitLock(8000); // max 8 detik tunggu concurrent

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
        timestamp,
        orderId,
        itemsJson,
        total,
        name,
        wa,
        note,
        source,
        "Baru",
        "",
        ua,
        ipHint
      ]);

      // Notifikasi email (jika ADMIN_EMAIL di-set di Script Properties)
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
  } catch (err) {
    return json_({
      success: false,
      error: String(err.message || err)
    });
  }
}

/**
 * Ambil sheet Orders. Buat otomatis jika belum ada.
 * Menggunakan SPREADSHEET_ID dari Script Properties jika di-set.
 */
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
    // Lebar kolom dasar
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 280);
  }
  return sheet;
}

/**
 * Order ID: NIF-YYYYMMDD-XXX (urutan harian, thread-safe via LockService)
 */
function generateOrderId_(sheet) {
  var tz = Session.getScriptTimeZone() || "Asia/Jakarta";
  var dateStr = Utilities.formatDate(new Date(), tz, "yyyyMMdd");
  var prefix = "NIF-" + dateStr + "-";

  var lastRow = sheet.getLastRow();
  var seq = 1;

  if (lastRow > 1) {
    // Ambil semua order_id (kolom B)
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

  var seqStr = ("000" + seq).slice(-3);
  return prefix + seqStr;
}

/**
 * Kirim email notifikasi ke admin (gratis, kuota Gmail tinggi)
 */
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
      "Buka Google Sheet untuk update status.";

    MailApp.sendEmail({
      to: adminEmail,
      subject: "[Niffalla] Order Baru " + orderId + " — " + name,
      body: body
    });
  } catch (e) {
    // Jangan gagalkan order hanya karena email gagal
    console.error("Email failed:", e);
  }
}

/**
 * Response JSON (CORS otomatis di-handle Apps Script Web App "Anyone")
 */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper sekali jalan: set Script Properties dari editor
 * Jalankan fungsi ini 1x dari Apps Script (Run → setProperties)
 * Lalu hapus / comment setelah selesai.
 */
function setProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    // Ganti dengan email kamu
    ADMIN_EMAIL: "emailkamu@gmail.com",
    // Opsional: ID spreadsheet (dari URL sheet, bagian /d/XXXX/edit)
    // SPREADSHEET_ID: "1AbCdEfGhIjKlMnOpQrStUvWxYz"
  }, false); // false = jangan hapus property lain
  Logger.log("Properties set: " + JSON.stringify(props.getProperties()));
}
