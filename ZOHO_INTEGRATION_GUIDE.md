# Complete Guide: Connecting Noon Emulator to Zoho CRM via Zoho Sigma

This guide explains how to connect your deployed Noon Marketplace & Seller Lab emulator with **Zoho CRM** using **Zoho Developer / Zoho Sigma**, and prepare your extension for publishing in the **Zoho Marketplace**.

---

## 1. Hosting on Vercel (2 Minutes)

You can host this project on Vercel with a live public HTTPS URL:

### Option A: Using GitHub & Vercel Dashboard (Recommended)
1. Push this repository (`d:\noon`) to your GitHub account:
   ```bash
   git add .
   git commit -m "Noon & Noon Seller Lab Emulator for Zoho CRM"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/noon-zoho-connector.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. Click **Deploy** (No environment variables required!).
5. Copy your live Vercel domain (e.g., `https://noon-uae-emulator.vercel.app`).

### Option B: Using Vercel CLI
```bash
npx vercel
```
Follow the quick prompts to deploy directly from your machine.

---

## 2. API Credentials & Authentication

Your emulator comes pre-configured with authentic Noon Partner API credentials:

* **Base URL**: `https://YOUR_VERCEL_DOMAIN.vercel.app`
* **Seller Identifier**: `noon_seller_uae_88921`
* **API Key**: `noon_live_9f82d1c73a4b08e6f152d399104cba7e`
* **Project ID**: `noon-partner-uae`
* **Marketplace**: UAE & Saudi Arabia (`AED`)

### Authentication Headers:
Every request made by Zoho CRM Deluge or Sigma must include:
```http
Authorization: Key noon_live_9f82d1c73a4b08e6f152d399104cba7e
x-seller-identifier: noon_seller_uae_88921
Content-Type: application/json
```
*(Query param bypass `?demo=true` is also supported for rapid browser testing).*

---

## 3. Configuring Your Extension in Zoho Sigma / Developer

1. Log in to [https://sigma.zoho.com](https://sigma.zoho.com) or [Zoho Developer Console](https://developer.zoho.com).
2. Click **Create Extension** and choose **Zoho CRM**.
3. Set Extension Name: `Noon Marketplace Connector for Zoho CRM`.
4. Go to **Extension Settings** (Configuration parameters visible to buyers in Zoho Marketplace):
   - Add Field 1: `noon_base_url` (Type: Text, Label: "Noon API Base URL", Default: your Vercel URL).
   - Add Field 2: `noon_seller_id` (Type: Text, Label: "Seller Identifier", Default: `noon_seller_uae_88921`).
   - Add Field 3: `noon_api_key` (Type: Password/Text, Label: "Noon API Secret Key").
5. Add a **Connection / Test Connection** button:
   - Target URL: `https://YOUR_VERCEL_DOMAIN.vercel.app/api/v1/seller/profile`
   - Expected status: `200 OK` with `success: true`.

---

## 4. Zoho Deluge Scripts Ready to Copy & Paste

### Script 1: Scheduled Order Synchronization (Fetch Noon Orders into Zoho CRM)
Create a Scheduled Function in Zoho CRM (e.g., runs every 15 or 30 minutes):

```javascript
// Zoho Deluge Script: Sync Noon Orders to Zoho CRM
noonBaseUrl = "https://YOUR_VERCEL_DOMAIN.vercel.app";
noonApiKey = "noon_live_9f82d1c73a4b08e6f152d399104cba7e";
noonSellerId = "noon_seller_uae_88921";

headers = Map();
headers.put("Authorization", "Key " + noonApiKey);
headers.put("x-seller-identifier", noonSellerId);
headers.put("Content-Type", "application/json");

// Fetch active orders from Noon API
response = invokeurl
[
	url: noonBaseUrl + "/api/v1/orders?status=PENDING&limit=50"
	type: GET
	headers: headers
];

if(response.get("success") == true)
{
	ordersList = response.get("data").get("orders");
	for each order in ordersList
	{
		orderId = order.get("order_id");
		customer = order.get("customer");
		totals = order.get("totals");
		fulfillment = order.get("fulfillment");
		
		// 1. Create or Find Contact in Zoho CRM
		contactMap = Map();
		contactMap.put("Last_Name", customer.get("name"));
		contactMap.put("Email", customer.get("email"));
		contactMap.put("Phone", customer.get("phone"));
		contactMap.put("Mailing_City", customer.get("city"));
		contactMap.put("Mailing_Street", customer.get("address_line1"));
		contactMap.put("Lead_Source", "Noon Marketplace");
		
		createContact = zoho.crm.createRecord("Contacts", contactMap);
		
		// 2. Create Deal / Sales Order in Zoho CRM
		dealMap = Map();
		dealMap.put("Deal_Name", "Noon Order - " + orderId);
		dealMap.put("Amount", totals.get("total_amount"));
		dealMap.put("Stage", "Closed Won");
		dealMap.put("Closing_Date", today);
		dealMap.put("Description", "Noon AWB: " + fulfillment.get("awb_number") + " | Carrier: " + fulfillment.get("carrier"));
		
		createDeal = zoho.crm.createRecord("Deals", dealMap);
		info "Synced Noon order: " + orderId;
	}
}
```

---

### Script 2: Push Zoho CRM / Inventory Stock Changes to Noon
Triggered by a Workflow Rule when product stock changes inside Zoho CRM / Zoho Inventory:

```javascript
// Zoho Deluge Script: Update Noon Stock
noonBaseUrl = "https://YOUR_VERCEL_DOMAIN.vercel.app";
noonApiKey = "noon_live_9f82d1c73a4b08e6f152d399104cba7e";

// Target SKU and new available quantity
sku = "N53346824A";
updatedStock = 30;

bodyMap = Map();
bodyMap.put("sku", sku);
bodyMap.put("stock", updatedStock);

headers = Map();
headers.put("Authorization", "Key " + noonApiKey);
headers.put("Content-Type", "application/json");

syncResponse = invokeurl
[
	url: noonBaseUrl + "/api/v1/catalog/stock"
	type: PUT
	parameters: bodyMap.toString()
	headers: headers
];

info syncResponse;
```

---

### Script 3: Real-Time Webhook Listener
If you configure a Webhook in the Seller Lab (`/seller` -> Zoho CRM Webhooks tab), Noon immediately sends an HTTP POST on every new customer purchase:

```javascript
// Zoho Deluge Script: Webhook Listener for instant order notification
void noon_webhook_listener(String crmPayload)
{
	payloadMap = crmPayload.toMap();
	event = payloadMap.get("event");
	
	if(event == "order.created")
	{
		orderData = payloadMap.get("data");
		orderId = orderData.get("order_id");
		customer = orderData.get("customer");
		
		// Instantly create task or notification for fulfillment team
		taskMap = Map();
		taskMap.put("Subject", "New Noon Order: " + orderId);
		taskMap.put("Status", "In Progress");
		taskMap.put("Priority", "High");
		zoho.crm.createRecord("Tasks", taskMap);
	}
}
```

---

## 5. Submitting Your Extension to Zoho Marketplace

When submitting your extension to Zoho Marketplace:
1. **Screenshots**: Take screenshots of your Vercel-hosted Noon Storefront and Seller Lab tabs (Orders, Catalog, Credentials, and Webhooks).
2. **Demo Credentials**: Provide your public Vercel URL and the sample API key in the submission notes so the Zoho review team can test the live integration.
3. **Help Documentation**: Link to the API endpoints and describe the two-way sync between Noon and Zoho CRM.
