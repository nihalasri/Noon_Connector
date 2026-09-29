# Noon Marketplace & Noon Seller Lab Replica + Mock API

A replica of **Noon Marketplace (`noon.com`)**, **Noon Seller Lab (`seller.noon.com` / `login.noon.partners`)**, and **Noon Seller Partner REST APIs**, designed for testing, developing, and publishing a **Zoho CRM Connector Extension** via **Zoho Sigma / Zoho Developer**.

---

## 🌟 What This Project Provides

1. **Noon Consumer Storefront (`/`)**:
   - Signature Noon Yellow (`#FEEE00`) & dark charcoal design system.
   - Real Middle East products in **AED** / **SAR** with Noon Express badges.
   - Interactive Cart and Checkout simulation (Dubai/Riyadh addresses, Card & COD).
   - Placing orders updates the shared database in real-time and fires webhooks.

2. **Noon Seller Lab Portal (`/seller`)**:
   - **Dashboard**: Live sales metrics, order counts, fulfillment status, and inventory alerts.
   - **Orders & Fulfillment**: Manage orders by status (`PENDING`, `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`), generate and print authentic **Noon Air Waybill (AWB)** shipping labels.
   - **Catalog & Stock Control**: Real-time stock and price adjustments to test two-way inventory sync.
   - **API Credentials**: Seller Identifier (`noon_seller_uae_88921`), API Key, Project ID, and downloadable `store_credentials.json`.
   - **Zoho CRM Webhook Manager**: Configure webhook target URLs and test dispatch with live HTTP status codes.
   - **Zoho Deluge & Sigma Guide**: Complete copy-paste Deluge scripts for scheduled sync, webhook handlers, and inventory updates.
   - **Interactive API Console**: Test endpoints with pre-filled tokens and cURL commands right in your browser.

3. **Noon Seller REST APIs (`/api/v1/*`)**:
   - `GET /api/v1/seller/profile`: Test connection endpoint for Zoho CRM extension settings.
   - `GET /api/v1/orders`: List paginated orders with status filters.
   - `GET /api/v1/orders/[orderId]`: Full order details, line items, and customer address.
   - `PUT /api/v1/orders/[orderId]/status`: Update order fulfillment status from Zoho CRM.
   - `GET /api/v1/orders/[orderId]/awb`: Generate printable HTML shipping labels.
   - `GET /api/v1/catalog`: Fetch product list, barcodes, and stock levels.
   - `PUT /api/v1/catalog/stock`: Two-way stock synchronization.
   - `PUT /api/v1/catalog/price`: Price updates.
   - `POST /api/v1/webhooks/test`: Dispatch sample webhooks to Zoho CRM.

---

## 🚀 Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser:
# Consumer Storefront: http://localhost:3000
# Seller Lab Portal:   http://localhost:3000/seller
```

---

## ☁️ Deploy to Vercel with Vercel Database (Postgres / Neon)

1. Push this repository to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new) and click **Deploy**.
3. **Attach Vercel Postgres** (Stores all Customer & Seller data permanently):
   - In your deployed project on Vercel, go to the **Storage** tab.
   - Click **Create Database** -> Choose **Postgres** (powered by Neon Serverless).
   - Click **Connect to Project** (`POSTGRES_URL` is configured automatically).
   - Trigger a redeploy or visit `/seller` -> **Vercel Database** tab to verify connection!
4. **Local Development with Vercel Database**:
   - Link project and pull database credentials:
     ```bash
     npx vercel link
     npx vercel env pull .env.local
     ```
   - If `POSTGRES_URL` is omitted, the app automatically runs in **zero-config local fallback mode** with an in-memory singleton.

---

## 🗄️ Database Architecture (Vercel Postgres)

| Table Name | Owner Domain | Stored Details |
| :--- | :--- | :--- |
| `noon_customers` | Customer Side | Customer name, email, phone, city, UAE/KSA delivery address, total orders placed, registration timestamps |
| `noon_sellers` | Seller Side | Seller ID (`noon_seller_uae_88921`), API Key, Project ID, store name, legal entity, VAT number, Zoho webhook settings |
| `noon_products` | Seller Side | Marketplace catalog, Arabic titles, brands, categories, AED prices, stock inventory, barcode |
| `noon_orders` | Customer + Seller | Customer order reference, payment method (Card/COD), order status (`PENDING` - `DELIVERED`), AWB tracking |
| `noon_order_items` | Customer + Seller | Line items per order, ordered SKUs, unit prices, quantities, and item totals |
| `noon_webhook_logs` | Seller Integration | Live audit log of webhook events dispatched to Zoho CRM with status codes and payloads |

---

## 📖 Zoho Integration Guide

See [ZOHO_INTEGRATION_GUIDE.md](file:///d:/noon/ZOHO_INTEGRATION_GUIDE.md) for full Deluge scripts and step-by-step instructions on setting up Zoho Sigma.
