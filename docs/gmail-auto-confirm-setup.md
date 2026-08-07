# Auto-Confirm UPI Payments via Gmail (No Phone Setup)

The **bank's credit email** (not SMS) does the job. A free Google Apps Script watches
the merchant's Gmail for those emails and auto-marks orders paid. Runs in the cloud —
nothing installed on any phone, works even if the phone is off.

## How it works

1. Customer pays via UPI → the note contains `Order SFM-XXXX`
2. The merchant's **bank sends a credit email alert** (the same text as the SMS)
3. Google Apps Script (in Gmail) checks every 2 minutes for emails containing `SFM-`
4. It extracts the order ID + amount and POSTs to our server
5. Server marks the order **paid**

---

## Step 1 — Enable bank credit email alerts

In your bank's net-banking app (the one for the merchant UPI number):
look for **Alerts / Notifications → Email alerts → Credit** and switch it **ON**.
Make sure the email address is the same Gmail you'll use below.

> This is the only bank-side step. If you can't find it, ask your bank's support
> for "account credit email alerts".

## Step 2 — Create the script

1. Go to **https://script.google.com** (sign in with the merchant's Gmail)
2. Click **+ New project**
3. Delete the default `function myFunction() { }`
4. Open `docs/gmail-auto-confirm-apps-script.js` in this repo, copy everything,
   and paste it in
5. On the line `var API_KEY = "PASTE_YOUR_SECRET_HERE";` replace the placeholder
   with:
   `2b58d93b2ac12d904b52c56d3d5cf9ef1632a39c321f98636f6af140c327a90f`
6. Press **Ctrl+S** to save → name it `SFM Auto Confirm` → **OK**

## Step 3 — Run setup once

1. In the editor's top toolbar, select `setupTrigger` in the function dropdown
2. Click **Run**
3. Gmail will ask for permissions → **Review permissions** → choose your account →
   **Advanced → Go to SFM Auto Confirm (unsafe)** → **Allow**
   (it says "unsafe" only because the script isn't Google-verified — it's your own code)
4. You'll see `Trigger created — running every 2 min.` in the log.

## Step 4 — Test it

1. Place a real ₹1 UPI order on the site and pay.
2. When the credit email arrives in Gmail, the script picks it up within ~2 minutes.
3. Check **Admin → Orders** — it should show **Paid** automatically.

You can also test instantly: open the script, select `processBankCredits`, press **Run**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Nothing happens | In the script editor run `processBankCredits` manually and read the log (View → Logs). It shows which order it sent and the server response. |
| Log shows `401` | `API_KEY` is wrong — re-copy the secret exactly. |
| Log shows `404 Order not found` | The order ID in the email doesn't match (typo / wrong Gmail). Check the email text contains `SFM-`. |
| No credit email arrives | Bank email alerts aren't enabled yet (Step 1), or the email account in net-banking isn't this Gmail. |
| Log shows `Multiple orders match` | Two unpaid orders with the same amount — the script left it unpaid intentionally. Mark manually once. |

## Security notes

- The secret is embedded in the script, so only share the script with people you trust.
- Emails already processed are remembered in script storage — no duplicate confirmations.
- The server still rejects wrong/missing keys, mismatched amounts, and unknown orders.
