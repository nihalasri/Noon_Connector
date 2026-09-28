import { Product, Order, SellerConfig, WebhookLog, OrderStatus } from './types';

// Initial realistic products for UAE / GCC Noon marketplace
export const INITIAL_PRODUCTS: Product[] = [
  {
    sku: 'N53346824A',
    title: 'Apple iPhone 16 Pro Max 256GB Desert Titanium 5G with FaceTime',
    title_ar: 'آبل آيفون 16 برو ماكس 256 جيجابايت تيتانيوم صحراوي',
    brand: 'Apple',
    category: 'Mobiles',
    price: 4799,
    original_price: 5099,
    currency: 'AED',
    stock: 24,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    rating_count: 1420,
    is_express: true,
    barcode: '195949038241',
    description: 'The iPhone 16 Pro Max features a strong and light titanium design with the largest Super Retina XDR display, A18 Pro chip, and Camera Control.',
    featured: true,
  },
  {
    sku: 'N70014289A',
    title: 'Samsung Galaxy S24 Ultra Dual SIM Titanium Gray 12GB RAM 512GB 5G',
    title_ar: 'سامسونج جالكسي S24 ألترا رمادي تيتانيوم 512 جيجابايت',
    brand: 'Samsung',
    category: 'Mobiles',
    price: 3899,
    original_price: 4699,
    currency: 'AED',
    stock: 18,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    rating_count: 980,
    is_express: true,
    barcode: '8806095368142',
    description: 'Galaxy AI is here. Search like never before, get quick language translation, and edit photos with ease.',
    featured: true,
  },
  {
    sku: 'N41208953A',
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black',
    title_ar: 'سوني WH-1000XM5 سماعات رأس لاسلكية عازلة للضوضاء - أسود',
    brand: 'Sony',
    category: 'Electronics',
    price: 1149,
    original_price: 1499,
    currency: 'AED',
    stock: 35,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    rating_count: 2310,
    is_express: true,
    barcode: '4548736132566',
    description: 'Industry-leading noise canceling with two processors and 8 microphones for unprecedented sound quality.',
    featured: true,
  },
  {
    sku: 'N58912304A',
    title: 'Apple Watch Series 10 GPS 46mm Jet Black Aluminium Case with Black Sport Band',
    title_ar: 'ساعة آبل الإصدار 10 بنظام تحديد المواقع 46 مم ألومنيوم أسود فاحم',
    brand: 'Apple',
    category: 'Electronics',
    price: 1649,
    original_price: 1799,
    currency: 'AED',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    rating_count: 640,
    is_express: true,
    barcode: '195949823412',
    description: 'Thinnest Apple Watch ever with the biggest display yet, advanced health sensors and faster charging.',
    featured: false,
  },
  {
    sku: 'N32981045A',
    title: 'Dior Sauvage Eau De Parfum for Men - 100ml',
    title_ar: 'ديور سوفاج أو دو بارفان للرجال - 100 مل',
    brand: 'Dior',
    category: 'Fragrances',
    price: 489,
    original_price: 590,
    currency: 'AED',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    rating_count: 3890,
    is_express: true,
    barcode: '3348901368249',
    description: 'A powerfully fresh creation, Sauvage Eau de Parfum unfurls notes of Reggio Bergamot and Papua New Guinean Vanilla.',
    featured: true,
  },
  {
    sku: 'N63219800A',
    title: 'Dyson Airwrap Multi-Styler Complete Long for Long Hair - Copper/Nickel',
    title_ar: 'دايسون إير راب مصفف شعر متكامل للشعر الطويل - نحاسي وفضي',
    brand: 'Dyson',
    category: 'Beauty',
    price: 2299,
    original_price: 2599,
    currency: 'AED',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    rating_count: 1120,
    is_express: true,
    barcode: '5025155068412',
    description: 'Styles hair using the Coanda effect, not extreme heat. Engineered for multiple hair types and styles.',
    featured: false,
  },
  {
    sku: 'N21457890A',
    title: 'Nespresso Vertuo Pop Coffee Machine by Magimix - Liquorice Black',
    title_ar: 'ماكينة قهوة نسبريسو فيرتو بوب من ماجيميكس - أسود',
    brand: 'Nespresso',
    category: 'Home',
    price: 449,
    original_price: 699,
    currency: 'AED',
    stock: 22,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    rating_count: 850,
    is_express: true,
    barcode: '7630054412389',
    description: 'Compact and vibrant, Vertuo Pop makes a bold statement to match your style with 4 coffee cup sizes.',
    featured: false,
  },
  {
    sku: 'N19845231A',
    title: 'Nike Air Force 1 07 Men Casual Shoes White/White 42 EU',
    title_ar: 'حذاء نايكي إير فورس 1 رجالي كاجوال أبيض 42',
    brand: 'Nike',
    category: 'Fashion',
    price: 399,
    original_price: 529,
    currency: 'AED',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    rating_count: 1560,
    is_express: true,
    barcode: '0194498321456',
    description: 'The radiance lives on with the b-ball OG. Crossing hardwood comfort with off-court flair.',
    featured: false,
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    order_id: 'NON-2026-90412',
    order_nr: '90412',
    order_date: '2026-09-28T14:22:10Z',
    status: 'CONFIRMED',
    payment_method: 'CARD',
    payment_status: 'PAID',
    currency: 'AED',
    items: [
      {
        sku: 'N53346824A',
        title: 'Apple iPhone 16 Pro Max 256GB Desert Titanium 5G with FaceTime',
        quantity: 1,
        unit_price: 4799,
        total_price: 4799,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
        category: 'Mobiles'
      }
    ],
    customer: {
      name: 'Tariq Al-Mansoor',
      email: 'tariq.mansoor@example.ae',
      phone: '+971 50 839 2145',
      country: 'United Arab Emirates',
      city: 'Dubai',
      address_line1: 'Apartment 1402, Marina Gate 1, Dubai Marina',
      postal_code: '00000'
    },
    totals: {
      subtotal: 4799,
      vat_rate: 0.05,
      vat_amount: 239.95,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 5038.95
    },
    fulfillment: {
      type: 'FBP',
      awb_number: 'AWB-NOON-90412-UAE',
      carrier: 'Noon Express Logistics',
      tracking_url: 'https://track.noon.express/AWB-NOON-90412-UAE',
    },
    created_at: '2026-09-28T14:22:10Z',
    updated_at: '2026-09-28T14:25:00Z'
  },
  {
    order_id: 'NON-2026-90411',
    order_nr: '90411',
    order_date: '2026-09-28T12:05:44Z',
    status: 'PENDING',
    payment_method: 'COD',
    payment_status: 'PENDING',
    currency: 'AED',
    items: [
      {
        sku: 'N32981045A',
        title: 'Dior Sauvage Eau De Parfum for Men - 100ml',
        quantity: 2,
        unit_price: 489,
        total_price: 978,
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80',
        category: 'Fragrances'
      }
    ],
    customer: {
      name: 'Khalid bin Sultan',
      email: 'khalid.sultan@example.sa',
      phone: '+966 55 124 9901',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      address_line1: 'Villa 12, King Fahd Road, Al Olaya',
      postal_code: '12211'
    },
    totals: {
      subtotal: 978,
      vat_rate: 0.15,
      vat_amount: 146.7,
      shipping_fee: 15,
      discount_amount: 0,
      total_amount: 1139.7
    },
    fulfillment: {
      type: 'FBP',
      awb_number: 'AWB-NOON-90411-KSA',
      carrier: 'Noon Express Logistics KSA',
      tracking_url: 'https://track.noon.express/AWB-NOON-90411-KSA',
    },
    created_at: '2026-09-28T12:05:44Z',
    updated_at: '2026-09-28T12:05:44Z'
  },
  {
    order_id: 'NON-2026-90398',
    order_nr: '90398',
    order_date: '2026-09-27T18:40:15Z',
    status: 'SHIPPED',
    payment_method: 'CARD',
    payment_status: 'PAID',
    currency: 'AED',
    items: [
      {
        sku: 'N41208953A',
        title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black',
        quantity: 1,
        unit_price: 1149,
        total_price: 1149,
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
        category: 'Electronics'
      },
      {
        sku: 'N21457890A',
        title: 'Nespresso Vertuo Pop Coffee Machine by Magimix - Liquorice Black',
        quantity: 1,
        unit_price: 449,
        total_price: 449,
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80',
        category: 'Home'
      }
    ],
    customer: {
      name: 'Fatima Al-Zahra',
      email: 'fatima.zahra@example.ae',
      phone: '+971 52 443 8912',
      country: 'United Arab Emirates',
      city: 'Abu Dhabi',
      address_line1: 'Tower 3, Al Reem Island, Shams Gate',
      postal_code: '00000'
    },
    totals: {
      subtotal: 1598,
      vat_rate: 0.05,
      vat_amount: 79.9,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 1677.9
    },
    fulfillment: {
      type: 'FBP',
      awb_number: 'AWB-NOON-90398-UAE',
      carrier: 'Noon Express Logistics',
      tracking_url: 'https://track.noon.express/AWB-NOON-90398-UAE',
      shipped_at: '2026-09-28T08:00:00Z'
    },
    created_at: '2026-09-27T18:40:15Z',
    updated_at: '2026-09-28T08:00:00Z'
  },
  {
    order_id: 'NON-2026-90370',
    order_nr: '90370',
    order_date: '2026-09-26T09:12:00Z',
    status: 'DELIVERED',
    payment_method: 'CARD',
    payment_status: 'PAID',
    currency: 'AED',
    items: [
      {
        sku: 'N19845231A',
        title: 'Nike Air Force 1 07 Men Casual Shoes White/White 42 EU',
        quantity: 1,
        unit_price: 399,
        total_price: 399,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
        category: 'Fashion'
      }
    ],
    customer: {
      name: 'Omar Farooq',
      email: 'omar.farooq@example.ae',
      phone: '+971 55 901 3344',
      country: 'United Arab Emirates',
      city: 'Dubai',
      address_line1: 'Villa 88, Street 14, Arabian Ranches 2',
      postal_code: '00000'
    },
    totals: {
      subtotal: 399,
      vat_rate: 0.05,
      vat_amount: 19.95,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 418.95
    },
    fulfillment: {
      type: 'FBP',
      awb_number: 'AWB-NOON-90370-UAE',
      carrier: 'Noon Express Logistics',
      tracking_url: 'https://track.noon.express/AWB-NOON-90370-UAE',
      shipped_at: '2026-09-26T14:00:00Z',
      delivered_at: '2026-09-27T11:30:00Z'
    },
    created_at: '2026-09-26T09:12:00Z',
    updated_at: '2026-09-27T11:30:00Z'
  }
];

export const INITIAL_SELLER_CONFIG: SellerConfig = {
  seller_identifier: 'noon_seller_uae_88921',
  api_key: 'noon_live_9f82d1c73a4b08e6f152d399104cba7e',
  project_id: 'noon-partner-uae',
  store_name: 'Apex Retail UAE',
  legal_name: 'Apex Global E-Commerce LLC',
  email: 'seller@apexretail.ae',
  phone: '+971 4 388 9000',
  country: 'AE',
  city: 'Dubai',
  currency: 'AED',
  vat_number: '100293847500003',
  webhook_url: '',
  webhook_secret: 'whsec_noon_zoho_998124a91cf2e45',
  webhook_events: ['order.created', 'order.status_updated', 'inventory.stock_updated']
};

// Global in-memory singleton to persist state across Next.js API requests
interface GlobalStore {
  products: Product[];
  orders: Order[];
  sellerConfig: SellerConfig;
  webhookLogs: WebhookLog[];
}

declare global {
  // eslint-disable-next-line no-var
  var __noonGlobalStore: GlobalStore | undefined;
}

function getStore(): GlobalStore {
  if (!globalThis.__noonGlobalStore) {
    globalThis.__noonGlobalStore = {
      products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
      orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
      sellerConfig: JSON.parse(JSON.stringify(INITIAL_SELLER_CONFIG)),
      webhookLogs: []
    };
  }
  return globalThis.__noonGlobalStore;
}

// Product operations
export function getProducts(): Product[] {
  return getStore().products;
}

export function getProductBySku(sku: string): Product | undefined {
  return getStore().products.find(p => p.sku.toUpperCase() === sku.toUpperCase());
}

export function updateProductStock(sku: string, newStock: number): Product | null {
  const store = getStore();
  const index = store.products.findIndex(p => p.sku.toUpperCase() === sku.toUpperCase());
  if (index === -1) return null;
  store.products[index].stock = Math.max(0, newStock);
  return store.products[index];
}

export function updateProductPrice(sku: string, newPrice: number): Product | null {
  const store = getStore();
  const index = store.products.findIndex(p => p.sku.toUpperCase() === sku.toUpperCase());
  if (index === -1) return null;
  store.products[index].price = newPrice;
  return store.products[index];
}

export function addProduct(product: Product): Product {
  const store = getStore();
  store.products.unshift(product);
  return product;
}

// Order operations
export function getOrders(filters?: { status?: string; limit?: number; page?: number }): { orders: Order[]; total: number; page: number; limit: number } {
  const store = getStore();
  let list = [...store.orders];

  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter(o => o.status.toUpperCase() === filters.status?.toUpperCase());
  }

  // Sort descending by order date
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const limit = filters?.limit && filters.limit > 0 ? filters.limit : 50;
  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit);

  return {
    orders: paginated,
    total: list.length,
    page,
    limit
  };
}

export function getOrderById(orderId: string): Order | undefined {
  return getStore().orders.find(o => o.order_id === orderId || o.order_nr === orderId);
}

export async function createOrder(data: {
  customer: Order['customer'];
  items: { sku: string; quantity: number }[];
  payment_method: 'CARD' | 'COD' | 'NOON_PAY';
}): Promise<Order> {
  const store = getStore();
  const orderNr = String(90400 + store.orders.length + 1);
  const orderId = `NON-2026-${orderNr}`;

  let subtotal = 0;
  const populatedItems: Order['items'] = [];

  for (const item of data.items) {
    const product = getProductBySku(item.sku);
    if (product) {
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      populatedItems.push({
        sku: product.sku,
        title: product.title,
        title_ar: product.title_ar,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: lineTotal,
        image: product.image,
        category: product.category
      });
      // Deduct stock
      updateProductStock(product.sku, product.stock - item.quantity);
    }
  }

  const vatRate = 0.05;
  const vatAmount = Number((subtotal * vatRate).toFixed(2));
  const shippingFee = subtotal > 100 ? 0 : 15;
  const totalAmount = Number((subtotal + vatAmount + shippingFee).toFixed(2));

  const newOrder: Order = {
    order_id: orderId,
    order_nr: orderNr,
    order_date: new Date().toISOString(),
    status: 'PENDING',
    payment_method: data.payment_method,
    payment_status: data.payment_method === 'CARD' ? 'PAID' : 'PENDING',
    currency: 'AED',
    items: populatedItems,
    customer: data.customer,
    totals: {
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      shipping_fee: shippingFee,
      discount_amount: 0,
      total_amount: totalAmount
    },
    fulfillment: {
      type: 'FBP',
      awb_number: `AWB-NOON-${orderNr}-UAE`,
      carrier: 'Noon Express Logistics',
      tracking_url: `https://track.noon.express/AWB-NOON-${orderNr}-UAE`
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.orders.unshift(newOrder);

  // Trigger Zoho webhook in background
  dispatchWebhook('order.created', {
    event: 'order.created',
    timestamp: newOrder.created_at,
    data: newOrder
  }).catch(err => console.error('Webhook dispatch error:', err));

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  extra?: { tracking_number?: string; carrier?: string }
): Promise<Order | null> {
  const store = getStore();
  const order = store.orders.find(o => o.order_id === orderId || o.order_nr === orderId);
  if (!order) return null;

  order.status = newStatus;
  order.updated_at = new Date().toISOString();

  if (extra?.tracking_number) {
    order.fulfillment.awb_number = extra.tracking_number;
  }
  if (extra?.carrier) {
    order.fulfillment.carrier = extra.carrier;
  }
  if (newStatus === 'PACKED') {
    order.fulfillment.packed_at = new Date().toISOString();
  }
  if (newStatus === 'SHIPPED') {
    order.fulfillment.shipped_at = new Date().toISOString();
  }
  if (newStatus === 'DELIVERED') {
    order.fulfillment.delivered_at = new Date().toISOString();
  }

  // Dispatch webhook event
  dispatchWebhook('order.status_updated', {
    event: 'order.status_updated',
    order_id: order.order_id,
    new_status: newStatus,
    timestamp: order.updated_at,
    data: order
  }).catch(err => console.error('Webhook dispatch error:', err));

  return order;
}

// Seller Config operations
export function getSellerConfig(): SellerConfig {
  return getStore().sellerConfig;
}

export function updateSellerConfig(updates: Partial<SellerConfig>): SellerConfig {
  const store = getStore();
  store.sellerConfig = { ...store.sellerConfig, ...updates };
  return store.sellerConfig;
}

// Webhook logging & dispatch
export function getWebhookLogs(): WebhookLog[] {
  return getStore().webhookLogs;
}

export async function dispatchWebhook(event: string, payload: any): Promise<WebhookLog | null> {
  const config = getSellerConfig();
  if (!config.webhook_url || !config.webhook_url.startsWith('http')) {
    return null;
  }

  // Check if this event type is enabled
  if (config.webhook_events && !config.webhook_events.includes(event)) {
    return null;
  }

  const logId = 'log_' + Date.now();
  let statusCode = 0;
  let responseText = '';
  let success = false;

  try {
    const res = await fetch(config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Noon-Webhook-Dispatcher/2.0',
        'X-Noon-Event': event,
        'X-Noon-Seller-Id': config.seller_identifier,
        'X-Noon-Signature': config.webhook_secret ? `sha256=${config.webhook_secret}` : ''
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000)
    });

    statusCode = res.status;
    responseText = await res.text().catch(() => '');
    success = res.ok;
  } catch (err: any) {
    statusCode = 500;
    responseText = err?.message || 'Connection failed';
    success = false;
  }

  const logEntry: WebhookLog = {
    id: logId,
    event,
    url: config.webhook_url,
    status_code: statusCode,
    payload,
    response_text: responseText.slice(0, 500),
    created_at: new Date().toISOString(),
    success
  };

  const store = getStore();
  store.webhookLogs.unshift(logEntry);
  if (store.webhookLogs.length > 50) {
    store.webhookLogs.pop();
  }

  return logEntry;
}

export function resetStore(): void {
  const store = getStore();
  store.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  store.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  store.sellerConfig = JSON.parse(JSON.stringify(INITIAL_SELLER_CONFIG));
  store.webhookLogs = [];
}
