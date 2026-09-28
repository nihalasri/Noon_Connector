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

## ☁️ Deploy to Vercel (1-Click)

1. Push this repository to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Click **Deploy**. No special environment variables are needed!
4. Use your Vercel URL (`https://your-app.vercel.app`) as the `noon_base_url` in Zoho Sigma!

---

## 📖 Zoho Integration Guide

See [ZOHO_INTEGRATION_GUIDE.md](file:///d:/noon/ZOHO_INTEGRATION_GUIDE.md) for full Deluge scripts and step-by-step instructions on setting up Zoho Sigma.
