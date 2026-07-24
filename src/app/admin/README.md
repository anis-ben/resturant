# 🔐 Admin & Staff Portals (`src/app/admin`)

This directory contains the operational management portals for restaurant staff.

---

## 📂 Portals Structure

### 1. Cashier Hub (`/admin/cashier`)
- **File:** `page.tsx`
- **Purpose:** Primary order reception, bill printing, and payment settlement hub.
- **Key Features:**
  - New order alerts & Cashier-First dispatch to Kitchen ("إرسال الطلب إلى المطبخ 🍳").
  - Settlement modal with cash change calculator and multi-payment selection (Cash / CIB / Card).
  - 80mm thermal receipt printing template with duplicate reprint tracking (`printed_count`).
  - Strikethrough sorting (`line-through text-gray-500`) for completed/paid orders at the bottom of the list.

### 2. Kitchen KDS Screen (`/admin/orders`)
- **File:** `page.tsx`
- **Purpose:** Real-time Kitchen Display System for line cooks and chefs.
- **Key Features:**
  - Filters out unverified `pending` orders — displays ONLY orders dispatched by Cashier (`preparing` / `ready`).
  - Action buttons: "تأكيد بدء التحضير 🍳" and "إعادة الطلب إلى الكاشير (جاهز) 🔔".
  - Audio alert chimes via Web Audio API when new orders arrive or waiter calls are triggered.
  - Kitchen Order Ticket (KOT) print preview.
  - Waiter Call alert banner for pending table calls.

### 3. Menu Management (`/admin/menu-management`)
- **File:** `page.tsx`
- **Purpose:** Dish catalog management.
- **Key Features:**
  - Instant dish availability toggles (out-of-stock items disable checkout in real-time).
  - Add/edit dish modals with image uploading via Supabase Storage (`restaurant-media` bucket).
  - Category filtering and Skeleton loaders.

### 4. Table & QR Management (`/admin/tables`)
- **File:** `page.tsx`
- **Purpose:** Table configuration & QR token generation.
- **Key Features:**
  - Unique `access_token` UUID generation per table for QR code ordering security.
  - Table status monitoring (`available`, `occupied`, `reserved`).

### 5. Staff Authentication (`/admin/login`)
- **File:** `page.tsx`
- **Purpose:** Staff login entry point.
