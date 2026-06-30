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

// Shared token: the website sends this in every submission and we reject
// anything without it. This blocks generic bots that blast random /exec
// URLs (they won't have it). It is NOT secret from a determined attacker —
// it lives in the public site JS — so it's a filter, not real auth.
// Must match FS_CONTACT_TOKEN in contact.html. Change both together.
var SHARED_TOKEN = 'fs_2f8Kqve9Lm3xZ7wpRt6Ncb1';

// reCAPTCHA v3 SECRET key is read from Script Properties so it never lives in
// this file or the repo. Set it in the editor under:
//   Project Settings (gear) ▸ Script Properties ▸ add property
//   name: recaptcha_secret_key   value: <your secret key>
// If the property is missing/empty, reCAPTCHA verification is simply skipped.
var RECAPTCHA_PROP = 'recaptcha_secret_key';

// Submissions scoring below this (0.0 = bot, 1.0 = human) are rejected.
// 0.5 is Google's suggested starting point.
var RECAPTCHA_MIN_SCORE = 0.5;

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Serialize writes so two submissions can't clobber the same row.
    lock.waitLock(20000);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    // Shared-token check: drop anything that didn't come from our site JS.
    // Pretend success so a prober can't tell the token was wrong.
    if (data.token !== SHARED_TOKEN) {
      return jsonOutput({ ok: true });
    }

    // Honeypot: real users never fill the hidden "website" field.
    // Pretend success so bots don't retry.
    if (data.website) {
      return jsonOutput({ ok: true });
    }

    // reCAPTCHA v3: verify the token with Google (skipped if not configured).
    var rc = verifyRecaptcha_(data.recaptchaToken);
    if (!rc.ok) {
      // `detail` is temporary — it surfaces WHY it failed so we can debug.
      // Remove `detail: rc` once the form is working.
      return jsonOutput({ ok: false, error: 'recaptcha', detail: rc });
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

// Verify a reCAPTCHA v3 token with Google. Returns true if the request
// should be allowed through. If no secret key is configured, verification
// is skipped (returns true) so the form keeps working without reCAPTCHA.
function verifyRecaptcha_(token) {
  var secret = PropertiesService.getScriptProperties().getProperty(RECAPTCHA_PROP);
  if (!secret) {
    return { ok: true, skipped: true }; // reCAPTCHA not set up yet — allow.
  }
  if (!token) {
    return { ok: false, reason: 'no-token-from-page' };
  }
  try {
    var resp = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true
    });
    var result = JSON.parse(resp.getContentText());
    // v3 returns success + a score (0.0–1.0). Require both.
    var pass = result.success === true &&
               (typeof result.score !== 'number' || result.score >= RECAPTCHA_MIN_SCORE);
    return {
      ok: pass,
      success: result.success,
      score: result.score,
      action: result.action,
      errors: result['error-codes']
    };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

// Run this ONCE from the editor (select "authorize" in the function dropdown
// and click Run) to grant the permissions the script needs — including the
// external-request permission used to verify reCAPTCHA. Approve the prompts.
function authorize() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', { muteHttpExceptions: true });
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
