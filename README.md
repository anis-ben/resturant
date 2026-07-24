# 🍽️ El Assala Gourmet — Restaurant Management & Ordering Platform

> **مطعم الأصالة والذوق الجميل** — An ultra-fast, secure, production-ready, RTL-first Arabic restaurant ordering and management system built with **Next.js 14**, **TypeScript**, **Supabase**, **Upstash Redis**, and **Tailwind CSS**.

---

## 🌟 Architecture Overview

This project is built using a **Feature-Based & Atomic Design Architecture**, ensuring high modularity, zero memory leaks, full type safety, and real-time database synchronization.

```text
resturant/
├── src/
│   ├── app/                    # Next.js App Router (Pages & API Routes)
│   │   ├── admin/              # Staff & Management Dashboard Portals
│   │   │   ├── cashier/        # Cashier Hub & Payment Settlement
│   │   │   ├── login/          # Staff Authentication
│   │   │   ├── menu-management/# Menu & Dish Management
│   │   │   ├── orders/         # Kitchen KDS Screen
│   │   │   └── tables/         # Table & QR Code Management
│   │   ├── api/                # Secure Route Handlers
│   │   │   ├── orders/         # Order Insertion API with DB Price Verification
│   │   │   ├── payments/       # Payment & Receipt Settlement API
│   │   │   └── waiter-calls/   # Waiter Bell Alert API
│   │   ├── checkout/           # Table & Online Checkout Page
│   │   ├── external-status/    # Customer Delivery/Takeout Live Order Tracker
│   │   ├── menu/               # Customer Digital Menu
│   │   ├── order-online/       # Delivery/Takeout Order Form
│   │   ├── order-status/       # Customer Dine-In Live Order Tracker
│   │   └── page.tsx            # Restaurant Homepage
│   ├── components/             # Reusable UI Components & Layouts
│   │   ├── layout/             # AdminNav, Header, OfflineBanner
│   │   └── ui/                 # Badge, Button, Modal, Skeleton
│   ├── features/               # Domain-driven Cart & Menu Features
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useCart.ts          # Zod-validated LocalStorage Cart Hook
│   │   ├── useOfflineQueue.ts  # IndexedDB Offline Sync Queue Hook
│   │   └── useRealtimeOrders.ts# Supabase Realtime KDS Orders & Waiter Calls Hook
│   ├── lib/                    # Core Infrastructure & Libraries
│   │   ├── indexeddb.ts        # Offline Storage Helper
│   │   ├── rate-limiter.ts     # Upstash Redis Sliding-Window Rate Limiter
│   │   └── supabase/           # Client & Admin Supabase SDK instances
│   ├── services/               # API & Data Fetching Services
│   │   ├── audio.service.ts    # Web Audio API Sound Alerts
│   │   ├── menu.service.ts     # Categories & Dishes Service
│   │   └── settings.service.ts # Restaurant Configuration Service
│   ├── types/                  # TypeScript Types & Zod Schemas
│   │   ├── database.types.ts   # Auto-generated Supabase DB Types
│   │   └── zod.schemas.ts      # Input Validation Schemas
│   └── utils/                  # Pure Utility Functions
│       ├── calculations.ts     # Float-precise Monetary Calculations
│       └── formatters.ts       # Currency (DZD) & Time Formatting
├── .env.example                # Template Environment Variables
├── AUDIT_REPORT.md             # Security & Quality Audit Documentation
├── middleware.ts               # Next.js Edge Rate-Limiting Middleware
└── tailwind.config.ts          # Restaurant Dark & Gold Theme Token Configuration
```

---

## ⚡ Tech Stack & Libraries

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React Server Components & API Route Handlers |
| **Language** | TypeScript (Strict Mode) | 100% type safety — zero `any` types |
| **Database** | Supabase (PostgreSQL) | Data persistence, RLS security, Realtime WebSockets |
| **Rate Limiter** | Upstash Redis | Distributed sliding-window rate limiting (`@upstash/ratelimit`) |
| **Offline Sync** | IndexedDB | PWA offline action queueing with conflict resolution |
| **Validation** | Zod | Runtime validation for API payloads & LocalStorage state |
| **Styling** | Tailwind CSS | Sleek dark-mode aesthetic with custom gold accents |
| **Icons** | Lucide React | High-contrast UI iconography |
| **Sound Engine**| Web Audio API | Custom chime synthesis for new orders and waiter alerts |

---

## 🔄 Order Lifecycle Blueprint

The system enforces a **Cashier-First Operational Sequence**:

### 🛵 1. External Orders (Delivery / Takeout)
1. **Initial Entry**: Customer submits order online (`/order-online`). Order lands **exclusively at Cashier** (`/admin/cashier`) with status `pending`. (Hidden from Kitchen KDS).
2. **Kitchen Dispatch**: Cashier verifies order and clicks **"إرسال الطلب إلى المطبخ 🍳"** (`pending` ➔ `preparing`).
3. **Kitchen Prep & Return**: Kitchen confirms prep on KDS (`/admin/orders`). Customer tracker shows "في المطبخ / جاري التحضير". Upon completion, kitchen clicks **"إعادة الطلب إلى الكاشير (جاهز) 🔔"** (`preparing` ➔ `ready`).
4. **Handover & Printing**: Order returns to Cashier screen as ready. Cashier prints thermal receipt and clicks **"التسليم للتوصيل الخارجي 🛵"** (`ready` ➔ `out_for_delivery` / `completed`). Paid orders sort to the **bottom with strikethrough styling**.

### 🍽️ 2. Dine-In Table Orders
1. **Initial Entry**: Customer scans QR code or orders at table (`/menu?t=ACCESS_TOKEN`). Order arrives at Cashier hub.
2. **Kitchen Dispatch**: Cashier sends order to kitchen.
3. **Kitchen Prep**: Kitchen prepares and returns order to Cashier as ready.
4. **Bill Settlement**: Cashier settles payment, prints 80mm thermal receipt (`/api/payments`), and completes order.

---

## 🛡️ Security & Reliability Audit Status

The codebase underwent a full security and type-safety audit (documented in `AUDIT_REPORT.md`):

- ✅ **0 `any` types**: All variables, props, and API returns are strictly typed.
- ✅ **Isolated Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` is restricted to server-side code only with mandatory environment validation.
- ✅ **Distributed Rate Limiting**: Upstash Redis sliding window protects `/api/orders`, `/api/waiter-calls`, and `/api/payments`.
- ✅ **Float-Precise Math**: All currency calculations use `Math.round(x * 100) / 100` to eliminate JS floating-point bugs (`0.1 + 0.2`).
- ✅ **Zod Guarded LocalStorage**: `useCart` validates cached state via `CartStateSchema` to prevent corrupted state crashes.
- ✅ **Cryptographic Receipts**: Receipt numbers use `crypto.randomUUID()` (4 billion possible values).

---
## 📄 License
All rights reserved © 2026 — **مطعم الأصالة والذوق الجميل**
