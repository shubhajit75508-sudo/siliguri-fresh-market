/**
 * Siliguri Fresh Mart — Gmail Auto-Confirm UPI Payments
 * ======================================================
 * Watches Gmail for bank credit emails that mention an order code (SFM-XXXX),
 * extracts the order + amount, and POSTs to our auto-confirm endpoint so the
 * order is marked paid automatically.
 *
 * SETUP:
 *   1. Create a new script at https://script.google.com (New project)
 *   2. Paste this file's contents in
 *   3. Set API_KEY below to PAYMENT_AUTO_CONFIRM_SECRET
 *   4. Run `setupTrigger` once (grants permissions)
 *   5. Enable bank "credit email alerts" for the account in net-banking
 *
 * The script uses a time-based trigger so it keeps running in the cloud —
 * nothing is installed on any phone.
 */

var ENDPOINT = "https://siliguri-fresh-market.vercel.app/api/payments/auto-confirm";

// Paste the secret value (same as PAYMENT_AUTO_CONFIRM_SECRET in Vercel) here.
// Keep the script private — never share it. Same trust level as MacroDroid.
var API_KEY = "PASTE_YOUR_SECRET_HERE";

var SEARCH_QUERY = "SFM- newer_than:7d";
var CHECK_INTERVAL_MINUTES = 2;

/** Scan recent bank credit emails and confirm matching orders. */
function processBankCredits() {
  var store = PropertiesService.getScriptProperties();
  var threads = GmailApp.search(SEARCH_QUERY);
  var confirmed = 0;

  for (var t = 0; t < threads.length; t++) {
    var messages = threads[t].getMessages();
    for (var m = 0; m < messages.length; m++) {
      var message = messages[m];
      var messageId = message.getId();

      // Skip emails we've already processed (prevents duplicate confirmations).
      if (store.getProperty("processed_" + messageId)) continue;

      var text = message.getSubject() + "\n" + message.getPlainBody();
      var orderId = extractOrderId(text);
      if (!orderId) continue; // not a Siliguri Fresh Mart credit

      var payload = { order_id: orderId };
      var amount = extractAmount(text);
      if (amount !== null) payload.amount = amount;

      var response = UrlFetchApp.fetch(ENDPOINT, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + API_KEY },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });

      // Always mark processed so the same email never re-fires, even on error.
      store.setProperty("processed_" + messageId, String(new Date().getTime()));
      confirmed++;
      Logger.log(orderId + " -> " + response.getResponseCode() + " " + response.getContentText());
    }
  }

  Logger.log("Scanned " + threads.length + " thread(s), sent " + confirmed + " confirmation(s).");
  return confirmed;
}

/** Extract SFM-XXXX from a message body. Returns null if absent. */
function extractOrderId(text) {
  var match = text.match(/SFM-[A-Z0-9]{5,20}/i);
  return match ? match[0].toUpperCase() : null;
}

/** Extract a rupee amount like "Rs.125.00" / "INR 125". Returns null if absent. */
function extractAmount(text) {
  var match = text.match(/(?:Rs\.?|\u20B9|INR)\s?([0-9]+(?:\.[0-9]{1,2})?)/i);
  return match ? parseFloat(match[1]) : null;
}

/** One-time setup: create the recurring trigger. Run this once from the editor. */
function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "processBankCredits") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("processBankCredits")
    .timeBased()
    .everyMinutes(CHECK_INTERVAL_MINUTES)
    .create();
  Logger.log("Trigger created — running every " + CHECK_INTERVAL_MINUTES + " min.");
}
