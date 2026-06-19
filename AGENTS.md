<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Required: Supabase Realtime
Run this in Supabase Dashboard → SQL Editor before Realtime delivery updates work:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```
(SQL is already in migration files — just needs execution against the live project)

## Required: Razorpay Webhook
1. Go to Razorpay Dashboard → Settings → Webhooks → Add New Webhook
2. URL: `https://siliguri-fresh-market.vercel.app/api/payment/webhook`
3. Events: `payment.captured`, `order.paid`
4. Copy the generated webhook secret into `RAZORPAY_WEBHOOK_SECRET` in Vercel env vars

## Required: Resend Domain Verification
1. Go to https://resend.com → Domains → Add Domain
2. Enter your sending domain (e.g. `siligurifreshmart.com`)
3. Add the DKIM/SPF DNS records at your DNS provider
4. Verify domain in Resend
5. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel env vars
