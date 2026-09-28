# Noon & Noon Seller Lab Replica + Mock API for Zoho CRM Marketplace Connector

## 1. Project Overview & Objective

You are building a **Zoho CRM Marketplace Extension** (using Zoho Sigma / Zoho Developer) to connect **Noon Marketplace** with Zoho CRM. Because you do not currently possess official Noon Seller credentials and live Noon Seller APIs, this project provides a **100% functional replica of Noon, Noon Seller Lab, and Noon Seller REST APIs** that you can host on **Vercel** with a public URL.

With this platform deployed:
1. You can test your Zoho CRM extension end-to-end (connecting, fetching orders, syncing stock, handling webhooks, updating order statuses).
2. You can record demo videos, take screenshots, and submit your extension to **Zoho Marketplace** review.
3. Once a real seller connects their live Noon account, your Zoho extension will work smoothly because all API schemas, headers, payloads, and flows mirror Noon's official Partner API specifications.

---

## 2. High-Level Architecture

- **Noon Consumer Storefront (`/`)**: Authentic Noon e-commerce experience (Noon Yellow `#FEEE00`, Arabic/English header, banner sliders, category navigation, real Middle East product catalog in AED/SAR, working cart, and checkout flow).
- **Noon Seller Lab Portal (`/seller`)**: Authentic Noon Seller dashboard with Orders table, AWB / Shipping Label generator, Catalog stock & price editor, and Developer settings.
- **Developer & Webhook Manager**: Generate Seller ID, API Keys, download `store_credentials.json`, configure Zoho CRM Webhook URLs, and inspect payloads.
- **Noon Seller REST APIs (`/api/v1/*`)**: Exact endpoint structure, headers, and JSON responses matching Noon Partner API specs for orders, inventory, fulfillment, and auth.
- **Zoho Sigma Integration Kit (`/seller/zoho-guide`)**: Ready-to-use Zoho Deluge scripts for scheduled sync, webhook listeners, and step-by-step marketplace extension setup.

---

## 3. Technology Stack & Vercel Deployment

- **Framework**: Next.js 14+ (App Router) with TypeScript.
- **Styling**: Tailored Vanilla CSS design system replicating Noon's brand identity.
- **Storage**: In-memory and state-synced storage initialized with seed products, test orders, and seller configuration.
- **Deployment**: 100% Vercel compatible (serverless API routes, zero binary dependencies).

---

## 4. Execution Phases

- **Phase 1: Project Setup & Core Design System**
- **Phase 2: Noon Seller REST API Engine**
- **Phase 3: Noon Consumer Storefront (`/`)**
- **Phase 4: Noon Seller Lab Dashboard (`/seller`) & Zoho Toolkit**
- **Phase 5: Verification, Live Testing & Vercel Instructions**
