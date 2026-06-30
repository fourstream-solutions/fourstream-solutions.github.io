/**
 * Fourstream Solutions — contact form backend (Google Apps Script)
 * --------------------------------------------------------------
 * This script receives form submissions from the website and appends
 * them as a new row in this Spreadsheet.
 *
 * SETUP (one time):
 *   1. Create a private Google Sheet (any name).
 *   2. In that Sheet: Extensions ▸ Apps Script. Delete the sample
 *      code and paste THIS file in.
 *   3. Optional: change SHEET_NAME below to the tab you want rows in.
 *   4. Click Deploy ▸ New deployment ▸ type "Web app".
 *        - Description:        contact form
 *        - Execute as:         Me (your account)
 *        - Who has access:     Anyone
 *      Click Deploy, authorize when prompted, and COPY the
 *      "Web app" URL (ends in /exec).
 *   5. Paste that URL into contact.html (FS_CONTACT_ENDPOINT).
 *
 * NOTE: After ANY code change you must Deploy ▸ Manage deployments ▸
 *       edit ▸ Version: "New version" for it to take effect, OR use
 *       a fresh deployment. The /exec URL stays the same across
 *       "new version" updates.
 */

// Tab (sheet) that submissions are written to. Created automatically
// if it doesn't exist yet.
var SHEET_NAME = 'Submissions';

// Column order written to the sheet. Header row is added automatically.
var HEADERS = ['Timestamp', 'Name', 'Email', 'Company', 'Subject', 'Message'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Serialize writes so two submissions can't clobber the same row.
    lock.waitLock(20000);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    // Honeypot: real users never fill the hidden "website" field.
    // Pretend success so bots don't retry.
    if (data.website) {
      return jsonOutput({ ok: true });
    }

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      sanitize_(data.name),
      sanitize_(data.email),
      sanitize_(data.company),
      sanitize_(data.subject),
      sanitize_(data.message)
    ]);

    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Friendly response if someone opens the URL in a browser (GET).
function doGet() {
  return jsonOutput({ ok: true, message: 'Fourstream Solutions contact endpoint is live.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, coerce to string, and cap length so a huge paste can't bloat the sheet.
function sanitize_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, 5000);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
