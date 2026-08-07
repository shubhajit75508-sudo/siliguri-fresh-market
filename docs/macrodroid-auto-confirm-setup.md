# Auto-Confirm UPI Payments (Simple Setup)

The phone only does **one thing**: when a bank credit SMS arrives, send it to our
server. The server does all the smart work (finding the order, checking the amount,
marking it paid).

## What you'll set up (5 steps)

1. Install MacroDroid
2. Allow SMS permission
3. Create a macro
4. Trigger: SMS received (filter `SFM-`)
5. Action: HTTP Request — **one field** for the URL, **one field** for the body

---

## Step 1 — Install MacroDroid

1. Open **Google Play Store** → search **MacroDroid** → **Install** → **Open**.

## Step 2 — Allow SMS

When MacroDroid asks for SMS permission, tap **Allow**.
(If you missed it: **Settings → Apps → MacroDroid → Permissions → SMS = Allow**)

## Step 3 — Create a macro

Tap the **+ Add Macro** button → name it `UPI Auto Confirm` → **OK**.

## Step 4 — Trigger: SMS received

1. Tap **+** next to **Triggers**
2. Tap **SMS Received**
3. In the filter box type: `SFM-`
4. Tap the **save/checkmark** (top right)

## Step 5 — Action: send it to the server

1. Tap **+** next to **Actions**
2. Search for and tap **HTTP Request**
3. Fill in ONLY these fields:
   - **Method**: `POST`
   - **URL**:
     `https://siliguri-fresh-market.vercel.app/api/payments/auto-confirm?key=2b58d93b2ac12d904b52c56d3d5cf9ef1632a39c321f98636f6af140c327a90f`
   - **Body**: `{"sms":"[sms_body]"}`
     (tap the **Variables** icon to pick `[sms_body]` if it doesn't auto-fill)
4. Save. Then save the macro (top-right tick).

**Done.** That's the whole setup.

---

## Test it

1. Place a real ₹1 UPI order on the site.
2. Pay with any UPI app.
3. When the bank SMS arrives, the phone automatically tells the server.
4. Check **Admin → Orders** — it should show **Paid** by itself.

---

## If it doesn't work

| Problem | Fix |
|---|---|
| Nothing happens when SMS arrives | Check macro is **enabled**. Then **Settings → Apps → MacroDroid → Battery → Unrestricted** (so Android doesn't kill it). |
| SMS shows no `Order SFM-...` | Your bank drops the note. Tell me what the SMS says and I'll switch the filter to amount matching. |
| Still stuck | The URL must be exactly the long one above — copy-paste it, don't retype. |
