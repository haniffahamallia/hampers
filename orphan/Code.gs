/**
 * Niffalla Luxury Hampers — Google Apps Script
 * Database Order (Google Sheets)
 *
 * Cara pakai:
 * 1. Buat Google Sheet baru, rename sheet pertama jadi "Orders"
 * 2. Isi baris 1 dengan header (lihat SETUP.md)
 * 3. Extensions → Apps Script → paste seluruh kode ini
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy URL Web App → tempel ke script.js (APPS_SCRIPT_URL)
 */

const SHEET_NAME = "Orders";

/**
 * Handle preflight CORS (OPTIONS) dan GET sederhana untuk testing
 */
function doGet(e) {
  return jsonResponse({
    ok: true,
    message: "Niffalla Order API is running",
    time: new Date().toISOString(),
  });
}

/**
 * Terima order dari website (POST)
 * Body dikirim sebagai text/plain berisi JSON
 */
function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || "{}";
    const data = JSON.parse(raw);

    if (data.action !== "create_order") {
      return jsonResponse({ success: false, error: "Unknown action" }, 400);
    }

    // Validasi minimal
    if (!data.customer_name || !data.customer_wa || !data.items || !data.items.length) {
      return jsonResponse({
        success: false,
        error: "Data tidak lengkap (nama, WA, atau items kosong)",
      }, 400);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Auto-create sheet + header jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
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
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    const orderId = generateOrderId(sheet);
    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || "Asia/Jakarta",
      "yyyy-MM-dd HH:mm:ss"
    );

    const itemsJson = JSON.stringify(data.items || []);
    const total = Number(data.total) || 0;
    const status = "Baru";

    sheet.appendRow([
      timestamp,
      orderId,
      itemsJson,
      total,
      String(data.customer_name).trim(),
      String(data.customer_wa).trim(),
      String(data.note || "").trim(),
      String(data.source || "website"),
      status,
      "", // admin_note kosong
    ]);

    return jsonResponse({
      success: true,
      order_id: orderId,
      timestamp: timestamp,
      message: "Order berhasil dicatat",
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: String(err.message || err),
    }, 500);
  }
}

/**
 * Generate order ID unik: NIF-YYYYMMDD-XXX
 * XXX = nomor urut hari ini (001, 002, ...)
 */
function generateOrderId(sheet) {
  const now = new Date();
  const dateStr = Utilities.formatDate(
    now,
    Session.getScriptTimeZone() || "Asia/Jakarta",
    "yyyyMMdd"
  );
  const prefix = "NIF-" + dateStr + "-";

  const lastRow = sheet.getLastRow();
  let seq = 1;

  if (lastRow > 1) {
    // Ambil order_id hari ini yang terakhir
    const ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
    const todayIds = ids.filter(function (id) {
      return id && String(id).indexOf(prefix) === 0;
    });
    if (todayIds.length) {
      const numbers = todayIds.map(function (id) {
        const part = String(id).split("-").pop();
        return parseInt(part, 10) || 0;
      });
      seq = Math.max.apply(null, numbers) + 1;
    }
  }

  const seqStr = ("000" + seq).slice(-3);
  return prefix + seqStr;
}

/**
 * Response JSON + CORS headers
 * Apps Script Web App otomatis handle CORS untuk browser
 * jika di-deploy dengan "Anyone"
 */
function jsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
