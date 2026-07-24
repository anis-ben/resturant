# 🌐 Backend Route Handlers (`src/app/api`)

This directory contains Next.js Route Handlers executing server-side logic and database operations.

---

## 🔒 Security & Middleware Protocols

All endpoints are protected by:
1. **Server-Side Supabase Admin Client** (`getAdminSupabase()`): Executes queries via service role credentials, enforcing DB integrity.
2. **Upstash Redis Rate Limiting**: Throttles request spikes per IP to prevent spam and double charges.
3. **Zod Input Validation**: Rejects invalid payloads with HTTP 400 before DB contact.

---

## 🛠️ Endpoints Overview

### 1. `POST /api/orders`
- **File:** `orders/route.ts`
- **Rate Limit:** 5 requests / min / IP
- **Payload:** `CreateOrderSchema` (Zod)
- **Security Logic:**
  - Verifies table `access_token` for dine-in orders.
  - **Server-Side Price Recalculation**: Fetches authoritative dish and modifier prices directly from Supabase DB to prevent client-side price tampering.
  - Checks dish `is_available` state.
  - Inserts `orders`, `order_items`, and `order_item_modifiers`.
  - Logs initial status entry into `order_status_history`.

### 2. `POST /api/payments`
- **File:** `payments/route.ts`
- **Rate Limit:** 10 requests / min / IP
- **Payload:** `PaymentSettlementSchema` (Zod)
- **Security Logic:**
  - Calculates total due using `Math.round(x * 100) / 100` float-precise rounding.
  - Generates cryptographically random receipt number (`RCPT-XXXXXXXX` via `crypto.randomUUID()`).
  - Checks if order was already paid; increments `printed_count` for duplicate reprints without double-charging.
  - Records payment in `payments` table and updates order status to `completed`.

### 3. `POST /api/waiter-calls`
- **File:** `waiter-calls/route.ts`
- **Rate Limit:** 3 requests / min / IP
- **Payload:** `WaiterCallSchema` (Zod)
- **Security Logic:**
  - Validates table `access_token`.
  - Inserts call record (`call_waiter` or `request_bill`) into `waiter_calls` table with `pending` status.
  - Triggers realtime notification to KDS screen.
