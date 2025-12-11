# WhyLearn Vision

This app now uses a Stripe subscription paywall. Only the main landing page (`/`) and the live demo (`/demo`) stay open; the workspace (`/app`) requires an active subscription.

## How the flow works
- Sign up always redirects to `/paywall`.
- `/app` is protected in middleware: unauthenticated users go to sign-in, subscribed users go through, and non-subscribed users are sent to `/paywall`.
- The paywall page starts Checkout, lets existing customers open the billing portal, and auto-redirects subscribed users back to `/app` (or a provided `redirectTo`).
- Stripe webhooks upsert subscription status into Supabase.

## Required environment
Set the following in `.env.local` (and your deployment):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (used by the webhook to write subscription rows)
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` (the recurring price to sell)
- `STRIPE_WEBHOOK_SECRET` (from the endpoint you create)
- `NEXT_PUBLIC_APP_URL` (e.g., `http://localhost:3000` or your production URL)

## Supabase schema for subscriptions
Run this SQL in Supabase to track billing:
```sql
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  price_id text,
  current_period_end timestamptz
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
on public.subscriptions for select
using (auth.uid() = user_id);
```
The Stripe webhook uses the service role key and bypasses RLS for writes.

## Stripe setup
1. Create a recurring Price in Stripe; set its ID as `STRIPE_PRICE_ID`.
2. Create a webhook endpoint pointing to `/api/stripe/webhook` and subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Local development
```bash
npm install
npm run dev
```
Install dependencies to pull in the new `stripe` package before running the dev server.
