# 📖 Technical Source of Truth & Developer Manual: `resturant` Platform (v2.0)

**Project Name:** `resturant`  
**Language & Direction:** Arabic (RTL-First, `dir="rtl"`, `lang="ar"`)  
**Target Region:** Algeria / MENA Region (Currency: Algerian Dinar `دج` / DZD)  
**Database Backend:** Supabase (Ref: `llgkwvvtjlpcxaiinhgq`)  
**Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zod  

---

## 🏗️ 1. Architecture & Folder Hierarchy

```text
resturant/
├── SKILLS.md                                # Technical Source of Truth (This File)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── middleware.ts                            # Next.js Middleware (Auth guards, Rate limiting, Role checks)
├── .env.local
├── supabase/
│   ├── migrations/
│   │   └── 20260724_init_schema.sql         # SQL DDL, Storage Buckets & RLS Policies
│   └── seed.sql                             # Initial Seed Data (Categories, Items, Tables, Settings)
├── src/
│   ├── app/                                 # Next.js App Router Routes
│   │   ├── layout.tsx                       # RTL Root Layout (dir="rtl", lang="ar")
│   │   ├── page.tsx                         # Landing Page (Takeout/Delivery Selector)
│   │   ├── menu/page.tsx                    # Dine-In QR Menu (?t={access_token})
│   │   ├── order-status/page.tsx            # Live Dine-In Order Status & Waiter Calls
│   │   ├── order-online/page.tsx            # Takeout & Delivery Menu
│   │   ├── checkout/page.tsx                # Multi-Step Checkout Flow
│   │   ├── external-status/page.tsx         # External Order Tracking
│   │   ├── admin/
│   │   │   ├── login/page.tsx               # Staff Login Screen
│   │   │   ├── orders/page.tsx              # KDS Realtime Live Orders Hub & KOT Print
│   │   │   ├── cashier/page.tsx             # Cashier Settlement & Thermal Receipt Print
│   │   │   ├── menu-management/page.tsx     # Menu CRUD, Image Upload & Availability Toggles
│   │   │   └── tables/page.tsx              # Table Management & QR Code Generator
│   │   └── api/
│   │       ├── orders/route.ts              # Server-Validated Order Submission API (Rate Limited)
│   │       ├── waiter-calls/route.ts        # Waiter Call Submission API (Rate Limited)
│   │       ├── payments/route.ts            # Cashier Settlement API
│   │       └── storage/upload/route.ts      # Server-Side Storage Upload Endpoint
│   ├── components/                          # UI Components
│   │   ├── ui/                              # Button, Modal, Badge, Drawer, Input, Skeleton
│   │   ├── layout/                          # Header, Footer, AdminSidebar, OfflineBanner
│   │   └── print/                           # KOTPrintTicket, ReceiptThermalTemplate
│   ├── features/                            # Feature Modules
│   │   ├── menu/                            # CategoryChips, MenuItemCard, CustomizationDrawer
│   │   ├── cart/                            # CartDrawer, CartItemRow, CartFloatingBar
│   │   ├── kds/                             # OrderCard, ElapsedTimer, StatusBadge, AudioActivator
│   │   └── cashier/                         # BillPreviewModal, ChangeCalculator, PaymentMethodSelector
│   ├── lib/                                 # Low-Level Clients & Storage (Strict Separation)
│   │   ├── supabase/
│   │   │   ├── client.ts                    # Browser Supabase Client (NEXT_PUBLIC_SUPABASE_ANON_KEY only)
│   │   │   ├── server.ts                    # Server Supabase Client (Cookies / Route Handlers)
│   │   │   └── admin.ts                     # Admin Client (SUPABASE_SERVICE_ROLE_KEY - NEVER client side!)
│   │   ├── indexeddb.ts                     # IndexedDB offline storage helper for KDS actions
│   │   └── rate-limiter.ts                  # In-Memory / Token Bucket rate limiter helper
│   ├── services/                            # Data Services & Realtime SDK
│   │   ├── orders.service.ts                # Orders & Realtime Subscriptions
│   │   ├── menu.service.ts                  # Categories, Items & Image Upload Queries
│   │   ├── cashier.service.ts               # Bill Settlement & Receipts
│   │   ├── settings.service.ts              # Restaurant Settings Queries & Cache
│   │   └── audio.service.ts                 # Web Audio API Sound Cues with User Activation Gate
│   ├── hooks/                               # React Hooks
│   │   ├── useCart.ts                       # Cart state management with local persistence
│   │   ├── useRealtimeOrders.ts             # Filtered Supabase subscription listener
│   │   └── useOfflineQueue.ts               # IndexedDB-backed offline status update queue for KDS
│   ├── types/                               # TypeScript Definitions
│   │   ├── database.types.ts                # Supabase Database Types
│   │   └── zod.schemas.ts                   # Zod Validation Schemas
│   └── utils/                               # Helper Utilities
│       ├── formatters.ts                    # LTR Currency (دج) & Date Formatters
│       └── calculations.ts                  # Price & Modifiers Calculations
└── tests/
    ├── unit/                                # Unit Tests (Cart, Pricing, Schemas)
    └── e2e/                                 # End-to-End Integration Flow Tests
```

---

## 🗄️ 2. Supabase Database & Storage Blueprint

### 2.1 Custom Enums
```sql
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved');
CREATE TYPE order_type AS ENUM ('dine_in', 'takeout', 'delivery');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
CREATE TYPE waiter_call_type AS ENUM ('call_waiter', 'request_bill');
CREATE TYPE waiter_call_status AS ENUM ('pending', 'resolved');
CREATE TYPE staff_role AS ENUM ('admin', 'cashier', 'kitchen', 'waiter');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'online');
CREATE TYPE payment_status AS ENUM ('paid', 'voided', 'refunded');
```

### 2.2 Relational Tables Summary
1. `restaurant_settings`: `id` (UUID), `is_open` (BOOLEAN), `tax_rate` (DECIMAL), `delivery_fee` (DECIMAL), `min_delivery_order` (DECIMAL), `whatsapp_number` (TEXT), `business_hours` (JSONB), `created_at`, `updated_at`.
2. `tables`: `id` (UUID), `table_number` (INT UNIQUE), `access_token` (UUID UNIQUE), `status` (`table_status`), `created_at`.
3. `categories`: `id` (UUID), `name_ar` (TEXT), `name_en` (TEXT), `sort_order` (INT), `created_at`.
4. `menu_items`: `id` (UUID), `category_id` (UUID), `name` (TEXT), `description` (TEXT), `price` (DECIMAL), `image_url` (TEXT), `is_available` (BOOLEAN), `badges` (TEXT[]), `sort_order` (INT), `created_at`.
5. `modifier_groups`: `id` (UUID), `menu_item_id` (UUID), `title` (TEXT), `is_required` (BOOLEAN), `min_selection` (INT), `max_selection` (INT).
6. `modifiers`: `id` (UUID), `group_id` (UUID), `name` (TEXT), `extra_price` (DECIMAL).
7. `orders`: `id` (UUID), `order_number` (BIGINT IDENTITY), `type` (`order_type`), `table_id` (UUID), `customer_name` (TEXT), `customer_phone` (TEXT), `delivery_address` (TEXT), `address_landmark` (TEXT), `status` (`order_status`), `total_amount` (DECIMAL), `notes` (TEXT), `cancelled_reason` (TEXT), `created_at`, `updated_at`.
8. `order_status_history`: `id` (UUID), `order_id` (UUID), `old_status` (TEXT), `new_status` (TEXT), `changed_by` (UUID), `changed_at`.
9. `order_items`: `id` (UUID), `order_id` (UUID), `menu_item_id` (UUID), `quantity` (INT), `unit_price` (DECIMAL), `notes` (TEXT).
10. `order_item_modifiers`: `id` (UUID), `order_item_id` (UUID), `modifier_id` (UUID), `extra_price` (DECIMAL).
11. `waiter_calls`: `id` (UUID), `table_id` (UUID), `type` (`waiter_call_type`), `status` (`waiter_call_status`), `created_at`.
12. `staff_users`: `id` (UUID REFERENCES auth.users), `full_name` (TEXT), `role` (`staff_role`), `is_active` (BOOLEAN), `created_at`.
13. `payments`: `id` (UUID), `order_id` (UUID), `cashier_id` (UUID), `payment_method` (`payment_method`), `amount_due` (DECIMAL), `amount_tendered` (DECIMAL), `change_due` (DECIMAL GENERATED), `discount_amount` (DECIMAL), `tax_amount` (DECIMAL), `receipt_number` (TEXT UNIQUE), `status` (`payment_status`), `void_reason` (TEXT), `printed_count` (INT), `created_at`.

### 2.3 Storage Bucket Architecture
- Bucket Name: `restaurant-media` (Public read, authenticated upload for staff/admin).
- Allowed MIME Types: `image/jpeg`, `image/png`, `image/webp`. Max File Size: 5MB.
- RLS Policy: `SELECT` public, `INSERT/UPDATE/DELETE` restricted to `staff_users.role IN ('admin', 'cashier')`.

---

## 🔒 3. Supabase Client Isolation Architecture

- `src/lib/supabase/client.ts`: Instantiates browser Supabase SDK with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Used exclusively in React components and hooks for public data and realtime subscriptions.
- `src/lib/supabase/server.ts`: Next.js Server Components / Route Handler client using server request context.
- `src/lib/supabase/admin.ts`: Instantiates Supabase SDK using `SUPABASE_SERVICE_ROLE_KEY`. **NEVER** imported in any client file or component. Only used inside server-side API routes (`/api/orders`, `/api/waiter-calls`, `/api/payments`).

---

## ⚡ 4. Offline Queue & Conflict Strategy

- **Queue Engine**: IndexedDB (using native IndexedDB API wrapper or lightweight helper in `src/lib/indexeddb.ts`).
- **Conflict Resolution**: Last-Write-Wins based on server `updated_at`. When syncing queued status updates, if an order's status was changed on the server by another staff member while offline, the KDS displays a toast notification ("تم تحديث الطلب بواسطة مستخدم آخر") and refetches the latest state.

---

## 🔊 5. Audio Autoplay Policy Gate

- Web Audio API context requires a explicit user gesture before playback.
- Staff screens (KDS & Cashier) render a modal or top bar prompt: `📢 اضغط هنا لتفعيل التنبيهات الصوتية للطلبات الجديدة` on first load to initialize the Web Audio AudioContext safely.
