import { neon } from '@neondatabase/serverless';
import { Product, Order, SellerConfig, WebhookLog, OrderStatus, CustomerDetails, CustomerRecord, DbStatusInfo } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SELLER_CONFIG, INITIAL_CUSTOMERS } from './initial-data';

// Determine connection string
function getConnectionString(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

// Global in-memory fallback store when Vercel Postgres is not connected
interface MemoryStore {
  products: Product[];
  orders: Order[];
  customers: CustomerRecord[];
  sellerConfig: SellerConfig;
  webhookLogs: WebhookLog[];
}

declare global {
  // eslint-disable-next-line no-var
  var __noonMemoryStore: MemoryStore | undefined;
}

function getMemoryStore(): MemoryStore {
  if (!globalThis.__noonMemoryStore) {
    globalThis.__noonMemoryStore = {
      products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
      orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
      customers: JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)),
      sellerConfig: JSON.parse(JSON.stringify(INITIAL_SELLER_CONFIG)),
      webhookLogs: []
    };
  }
  return globalThis.__noonMemoryStore;
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Initialize Postgres tables if not exists
export async function ensureDatabaseReady(): Promise<boolean> {
  const connStr = getConnectionString();
  if (!connStr) {
    return false;
  }

  if (isInitialized) return true;
  if (initPromise) {
    await initPromise;
    return true;
  }

  initPromise = (async () => {
    try {
      const sql = neon(connStr);

      // 1. Create Sellers Table
      await sql`
        CREATE TABLE IF NOT EXISTS noon_sellers (
          seller_identifier VARCHAR(100) PRIMARY KEY,
          api_key VARCHAR(255) NOT NULL,
          project_id VARCHAR(100) NOT NULL,
          store_name VARCHAR(255) NOT NULL,
          legal_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(100) NOT NULL,
          country VARCHAR(50) NOT NULL,
          city VARCHAR(100) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'AED',
          vat_number VARCHAR(100),
          fulfillment_model VARCHAR(50) DEFAULT 'FBP',
          webhook_url TEXT,
          webhook_secret VARCHAR(255),
          webhook_events JSONB DEFAULT '["order.created", "order.status_updated", "inventory.stock_updated"]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // 2. Create Products Table
      await sql`
        CREATE TABLE IF NOT EXISTS noon_products (
          sku VARCHAR(100) PRIMARY KEY,
          seller_identifier VARCHAR(100),
          title TEXT NOT NULL,
          title_ar TEXT,
          brand VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          price NUMERIC(12, 2) NOT NULL,
          original_price NUMERIC(12, 2) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'AED',
          stock INT NOT NULL DEFAULT 0,
          image TEXT NOT NULL,
          rating NUMERIC(3, 2) DEFAULT 4.5,
          rating_count INT DEFAULT 0,
          is_express BOOLEAN DEFAULT TRUE,
          barcode VARCHAR(100),
          description TEXT,
          featured BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // 3. Create Customers Table
      await sql`
        CREATE TABLE IF NOT EXISTS noon_customers (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(100) NOT NULL,
          country VARCHAR(100) NOT NULL,
          city VARCHAR(100) NOT NULL,
          address_line1 TEXT NOT NULL,
          address_line2 TEXT,
          postal_code VARCHAR(50),
          total_orders INT DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // 4. Create Orders Table
      await sql`
        CREATE TABLE IF NOT EXISTS noon_orders (
          order_id VARCHAR(100) PRIMARY KEY,
          order_nr VARCHAR(50) NOT NULL,
          order_date TIMESTAMPTZ NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
          payment_method VARCHAR(50) NOT NULL,
          payment_status VARCHAR(50) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'AED',
          customer_id VARCHAR(100),
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(100) NOT NULL,
          customer_country VARCHAR(100) NOT NULL,
          customer_city VARCHAR(100) NOT NULL,
          customer_address_line1 TEXT NOT NULL,
          customer_address_line2 TEXT,
          customer_postal_code VARCHAR(50),
          subtotal NUMERIC(12, 2) NOT NULL,
          vat_rate NUMERIC(5, 4) NOT NULL,
          vat_amount NUMERIC(12, 2) NOT NULL,
          shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
          discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          total_amount NUMERIC(12, 2) NOT NULL,
          fulfillment_type VARCHAR(50) DEFAULT 'FBP',
          fulfillment_awb VARCHAR(100),
          fulfillment_carrier VARCHAR(255),
          fulfillment_tracking_url TEXT,
          fulfillment_packed_at TIMESTAMPTZ,
          fulfillment_shipped_at TIMESTAMPTZ,
          fulfillment_delivered_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // 5. Create Order Items Table
      await sql`
        CREATE TABLE IF NOT EXISTS noon_order_items (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(100) NOT NULL REFERENCES noon_orders(order_id) ON DELETE CASCADE,
          sku VARCHAR(100) NOT NULL,
          title TEXT NOT NULL,
          title_ar TEXT,
          quantity INT NOT NULL,
          unit_price NUMERIC(12, 2) NOT NULL,
          total_price NUMERIC(12, 2) NOT NULL,
          image TEXT NOT NULL,
          category VARCHAR(100)
        );
      `;

      // 6. Create Webhook Logs Table
      await sql`
        CREATE TABLE IF NOT EXISTS noon_webhook_logs (
          id VARCHAR(100) PRIMARY KEY,
          seller_identifier VARCHAR(100),
          event VARCHAR(100) NOT NULL,
          url TEXT NOT NULL,
          status_code INT NOT NULL,
          payload JSONB NOT NULL,
          response_text TEXT,
          success BOOLEAN NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Seed Initial Data if empty
      const sellerCount = await sql`SELECT COUNT(*)::int as count FROM noon_sellers`;
      if (sellerCount[0]?.count === 0) {
        await sql`
          INSERT INTO noon_sellers (
            seller_identifier, api_key, project_id, store_name, legal_name,
            email, phone, country, city, currency, vat_number,
            webhook_url, webhook_secret, webhook_events
          ) VALUES (
            ${INITIAL_SELLER_CONFIG.seller_identifier},
            ${INITIAL_SELLER_CONFIG.api_key},
            ${INITIAL_SELLER_CONFIG.project_id},
            ${INITIAL_SELLER_CONFIG.store_name},
            ${INITIAL_SELLER_CONFIG.legal_name},
            ${INITIAL_SELLER_CONFIG.email},
            ${INITIAL_SELLER_CONFIG.phone},
            ${INITIAL_SELLER_CONFIG.country},
            ${INITIAL_SELLER_CONFIG.city},
            ${INITIAL_SELLER_CONFIG.currency},
            ${INITIAL_SELLER_CONFIG.vat_number},
            ${INITIAL_SELLER_CONFIG.webhook_url},
            ${INITIAL_SELLER_CONFIG.webhook_secret},
            ${JSON.stringify(INITIAL_SELLER_CONFIG.webhook_events)}::jsonb
          )
        `;
      }

      const productCount = await sql`SELECT COUNT(*)::int as count FROM noon_products`;
      if (productCount[0]?.count === 0) {
        for (const p of INITIAL_PRODUCTS) {
          await sql`
            INSERT INTO noon_products (
              sku, seller_identifier, title, title_ar, brand, category,
              price, original_price, currency, stock, image,
              rating, rating_count, is_express, barcode, description, featured
            ) VALUES (
              ${p.sku}, 'noon_seller_uae_88921', ${p.title}, ${p.title_ar},
              ${p.brand}, ${p.category}, ${p.price}, ${p.original_price},
              ${p.currency}, ${p.stock}, ${p.image}, ${p.rating},
              ${p.rating_count}, ${p.is_express}, ${p.barcode},
              ${p.description}, ${p.featured ?? false}
            )
          `;
        }
      }

      const customerCount = await sql`SELECT COUNT(*)::int as count FROM noon_customers`;
      if (customerCount[0]?.count === 0) {
        for (const c of INITIAL_CUSTOMERS) {
          await sql`
            INSERT INTO noon_customers (
              id, name, email, phone, country, city,
              address_line1, postal_code, total_orders
            ) VALUES (
              ${c.id}, ${c.name}, ${c.email}, ${c.phone}, ${c.country},
              ${c.city}, ${c.address_line1}, ${c.postal_code || '00000'}, ${c.total_orders}
            )
          `;
        }
      }

      const orderCount = await sql`SELECT COUNT(*)::int as count FROM noon_orders`;
      if (orderCount[0]?.count === 0) {
        for (const o of INITIAL_ORDERS) {
          await sql`
            INSERT INTO noon_orders (
              order_id, order_nr, order_date, status, payment_method,
              payment_status, currency, customer_name, customer_email,
              customer_phone, customer_country, customer_city,
              customer_address_line1, customer_postal_code,
              subtotal, vat_rate, vat_amount, shipping_fee, discount_amount, total_amount,
              fulfillment_type, fulfillment_awb, fulfillment_carrier, fulfillment_tracking_url,
              fulfillment_shipped_at, fulfillment_delivered_at, created_at, updated_at
            ) VALUES (
              ${o.order_id}, ${o.order_nr}, ${o.order_date}, ${o.status}, ${o.payment_method},
              ${o.payment_status}, ${o.currency}, ${o.customer.name}, ${o.customer.email},
              ${o.customer.phone}, ${o.customer.country}, ${o.customer.city},
              ${o.customer.address_line1}, ${o.customer.postal_code || '00000'},
              ${o.totals.subtotal}, ${o.totals.vat_rate}, ${o.totals.vat_amount},
              ${o.totals.shipping_fee}, ${o.totals.discount_amount}, ${o.totals.total_amount},
              ${o.fulfillment.type}, ${o.fulfillment.awb_number}, ${o.fulfillment.carrier},
              ${o.fulfillment.tracking_url}, ${o.fulfillment.shipped_at || null},
              ${o.fulfillment.delivered_at || null}, ${o.created_at}, ${o.updated_at}
            )
          `;

          for (const item of o.items) {
            await sql`
              INSERT INTO noon_order_items (
                order_id, sku, title, title_ar, quantity, unit_price, total_price, image, category
              ) VALUES (
                ${o.order_id}, ${item.sku}, ${item.title}, ${item.title_ar || null},
                ${item.quantity}, ${item.unit_price}, ${item.total_price},
                ${item.image}, ${item.category || null}
              )
            `;
          }
        }
      }

      isInitialized = true;
      console.log('✅ Vercel Postgres: Noon tables and seed data initialized successfully.');
    } catch (err) {
      console.error('⚠️ Vercel Postgres initialization failed, using fallback:', err);
      isInitialized = false;
    }
  })();

  await initPromise;
  return isInitialized;
}

// Helper: map DB product row to Product type
function mapDbProduct(row: any): Product {
  return {
    sku: row.sku,
    title: row.title,
    title_ar: row.title_ar || '',
    brand: row.brand,
    category: row.category,
    price: Number(row.price),
    original_price: Number(row.original_price),
    currency: row.currency,
    stock: Number(row.stock),
    image: row.image,
    rating: Number(row.rating),
    rating_count: Number(row.rating_count),
    is_express: Boolean(row.is_express),
    barcode: row.barcode || '',
    description: row.description || '',
    featured: Boolean(row.featured)
  };
}

// Helper: map DB order row + items to Order type
function mapDbOrder(row: any, items: any[] = []): Order {
  return {
    order_id: row.order_id,
    order_nr: row.order_nr,
    order_date: row.order_date instanceof Date ? row.order_date.toISOString() : String(row.order_date),
    status: row.status as OrderStatus,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    currency: row.currency,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      country: row.customer_country,
      city: row.customer_city,
      address_line1: row.customer_address_line1,
      address_line2: row.customer_address_line2 || undefined,
      postal_code: row.customer_postal_code || undefined
    },
    totals: {
      subtotal: Number(row.subtotal),
      vat_rate: Number(row.vat_rate),
      vat_amount: Number(row.vat_amount),
      shipping_fee: Number(row.shipping_fee),
      discount_amount: Number(row.discount_amount),
      total_amount: Number(row.total_amount)
    },
    fulfillment: {
      type: row.fulfillment_type || 'FBP',
      awb_number: row.fulfillment_awb || '',
      carrier: row.fulfillment_carrier || 'Noon Express Logistics',
      tracking_url: row.fulfillment_tracking_url || '',
      packed_at: row.fulfillment_packed_at ? new Date(row.fulfillment_packed_at).toISOString() : undefined,
      shipped_at: row.fulfillment_shipped_at ? new Date(row.fulfillment_shipped_at).toISOString() : undefined,
      delivered_at: row.fulfillment_delivered_at ? new Date(row.fulfillment_delivered_at).toISOString() : undefined
    },
    items: items.map(item => ({
      sku: item.sku,
      title: item.title,
      title_ar: item.title_ar || undefined,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price),
      image: item.image,
      category: item.category || undefined
    })),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
}

// -------------------------------------------------------------
// PRODUCT OPERATIONS
// -------------------------------------------------------------
export async function getProductsFromDb(filters?: { category?: string; search?: string }): Promise<Product[]> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      let rows: any[];

      const hasCategory = Boolean(filters?.category && filters.category.toLowerCase() !== 'all');
      const hasSearch = Boolean(filters?.search);

      if (hasCategory && hasSearch) {
        const cat = filters!.category!.toLowerCase();
        const s = `%${filters!.search!.toLowerCase()}%`;
        rows = await sql`
          SELECT * FROM noon_products 
          WHERE LOWER(category) = ${cat} 
            AND (LOWER(title) LIKE ${s} OR LOWER(sku) LIKE ${s} OR LOWER(brand) LIKE ${s})
          ORDER BY featured DESC, created_at DESC
        `;
      } else if (hasCategory) {
        const cat = filters!.category!.toLowerCase();
        rows = await sql`
          SELECT * FROM noon_products 
          WHERE LOWER(category) = ${cat}
          ORDER BY featured DESC, created_at DESC
        `;
      } else if (hasSearch) {
        const s = `%${filters!.search!.toLowerCase()}%`;
        rows = await sql`
          SELECT * FROM noon_products 
          WHERE (LOWER(title) LIKE ${s} OR LOWER(sku) LIKE ${s} OR LOWER(brand) LIKE ${s})
          ORDER BY featured DESC, created_at DESC
        `;
      } else {
        rows = await sql`
          SELECT * FROM noon_products 
          ORDER BY featured DESC, created_at DESC
        `;
      }

      return rows.map(mapDbProduct);
    } catch (err) {
      console.error('Error fetching products from Vercel DB:', err);
    }
  }

  // Memory fallback
  const store = getMemoryStore();
  let list = [...store.products];
  if (filters?.category && filters.category.toLowerCase() !== 'all') {
    list = list.filter(p => p.category.toLowerCase() === filters.category?.toLowerCase());
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(p => p.title.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s));
  }
  return list;
}

export async function getProductBySkuFromDb(sku: string): Promise<Product | undefined> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`SELECT * FROM noon_products WHERE UPPER(sku) = UPPER(${sku}) LIMIT 1`;
      if (rows.length > 0) {
        return mapDbProduct(rows[0]);
      }
      return undefined;
    } catch (err) {
      console.error(`Error fetching product ${sku} from Vercel DB:`, err);
    }
  }

  const store = getMemoryStore();
  return store.products.find(p => p.sku.toUpperCase() === sku.toUpperCase());
}

export async function updateProductStockInDb(sku: string, newStock: number): Promise<Product | null> {
  const safeStock = Math.max(0, newStock);
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`
        UPDATE noon_products 
        SET stock = ${safeStock}, updated_at = CURRENT_TIMESTAMP 
        WHERE UPPER(sku) = UPPER(${sku}) 
        RETURNING *
      `;
      if (rows.length > 0) {
        return mapDbProduct(rows[0]);
      }
      return null;
    } catch (err) {
      console.error(`Error updating stock for ${sku} in Vercel DB:`, err);
    }
  }

  const store = getMemoryStore();
  const index = store.products.findIndex(p => p.sku.toUpperCase() === sku.toUpperCase());
  if (index === -1) return null;
  store.products[index].stock = safeStock;
  return store.products[index];
}

export async function updateProductPriceInDb(sku: string, newPrice: number): Promise<Product | null> {
  const safePrice = Math.max(0, newPrice);
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`
        UPDATE noon_products 
        SET price = ${safePrice}, updated_at = CURRENT_TIMESTAMP 
        WHERE UPPER(sku) = UPPER(${sku}) 
        RETURNING *
      `;
      if (rows.length > 0) {
        return mapDbProduct(rows[0]);
      }
      return null;
    } catch (err) {
      console.error(`Error updating price for ${sku} in Vercel DB:`, err);
    }
  }

  const store = getMemoryStore();
  const index = store.products.findIndex(p => p.sku.toUpperCase() === sku.toUpperCase());
  if (index === -1) return null;
  store.products[index].price = safePrice;
  return store.products[index];
}

export async function addProductInDb(product: Product): Promise<Product> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      await sql`
        INSERT INTO noon_products (
          sku, seller_identifier, title, title_ar, brand, category,
          price, original_price, currency, stock, image,
          rating, rating_count, is_express, barcode, description, featured
        ) VALUES (
          ${product.sku}, 'noon_seller_uae_88921', ${product.title}, ${product.title_ar || ''},
          ${product.brand}, ${product.category}, ${product.price}, ${product.original_price || product.price},
          ${product.currency || 'AED'}, ${product.stock}, ${product.image}, ${product.rating || 4.5},
          ${product.rating_count || 10}, ${product.is_express ?? true}, ${product.barcode || ''},
          ${product.description || ''}, ${product.featured ?? false}
        )
        ON CONFLICT (sku) DO UPDATE SET
          title = EXCLUDED.title,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          stock = EXCLUDED.stock,
          image = EXCLUDED.image,
          barcode = EXCLUDED.barcode,
          description = EXCLUDED.description,
          is_express = EXCLUDED.is_express,
          updated_at = CURRENT_TIMESTAMP
      `;
      return product;
    } catch (err) {
      console.error('Error adding product to Vercel DB:', err);
    }
  }

  const store = getMemoryStore();
  const existingIdx = store.products.findIndex(p => p.sku.toUpperCase() === product.sku.toUpperCase());
  if (existingIdx >= 0) {
    store.products[existingIdx] = { ...store.products[existingIdx], ...product };
  } else {
    store.products.unshift(product);
  }
  return product;
}

export async function updateProductInDb(sku: string, updates: Partial<Product>): Promise<Product | null> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const existingRows = await sql`SELECT * FROM noon_products WHERE UPPER(sku) = UPPER(${sku}) LIMIT 1`;
      if (existingRows.length === 0) return null;

      const current = mapDbProduct(existingRows[0]);
      const merged: Product = {
        ...current,
        ...updates,
        sku: current.sku // keep SKU immutable
      };

      const rows = await sql`
        UPDATE noon_products SET
          title = ${merged.title},
          title_ar = ${merged.title_ar || merged.title},
          brand = ${merged.brand},
          category = ${merged.category},
          price = ${merged.price},
          original_price = ${merged.original_price || merged.price},
          stock = ${merged.stock},
          image = ${merged.image},
          barcode = ${merged.barcode || ''},
          description = ${merged.description || ''},
          is_express = ${merged.is_express ?? true},
          updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(sku) = UPPER(${sku})
        RETURNING *
      `;

      if (rows.length > 0) {
        return mapDbProduct(rows[0]);
      }
      return null;
    } catch (err) {
      console.error(`Error updating product ${sku} in Vercel DB:`, err);
    }
  }

  const store = getMemoryStore();
  const index = store.products.findIndex(p => p.sku.toUpperCase() === sku.toUpperCase());
  if (index === -1) return null;
  store.products[index] = { ...store.products[index], ...updates };
  return store.products[index];
}

// -------------------------------------------------------------
// CUSTOMER OPERATIONS
// -------------------------------------------------------------
export async function upsertCustomerInDb(customer: CustomerDetails): Promise<CustomerRecord> {
  const customerId = `cust_${customer.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const now = new Date().toISOString();
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`
        INSERT INTO noon_customers (
          id, name, email, phone, country, city,
          address_line1, address_line2, postal_code, total_orders
        ) VALUES (
          ${customerId}, ${customer.name}, ${customer.email.toLowerCase()}, ${customer.phone},
          ${customer.country}, ${customer.city}, ${customer.address_line1},
          ${customer.address_line2 || null}, ${customer.postal_code || '00000'}, 1
        )
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          country = EXCLUDED.country,
          city = EXCLUDED.city,
          address_line1 = EXCLUDED.address_line1,
          address_line2 = EXCLUDED.address_line2,
          postal_code = EXCLUDED.postal_code,
          total_orders = noon_customers.total_orders + 1,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          country: r.country,
          city: r.city,
          address_line1: r.address_line1,
          address_line2: r.address_line2 || undefined,
          postal_code: r.postal_code || undefined,
          total_orders: Number(r.total_orders),
          created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
          updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at)
        };
      }
    } catch (err) {
      console.error('Error upserting customer in Vercel DB:', err);
    }
  }

  // Memory fallback
  const store = getMemoryStore();
  const existingIndex = store.customers.findIndex(c => c.email.toLowerCase() === customer.email.toLowerCase());
  if (existingIndex >= 0) {
    store.customers[existingIndex] = {
      ...store.customers[existingIndex],
      ...customer,
      total_orders: store.customers[existingIndex].total_orders + 1,
      updated_at: now
    };
    return store.customers[existingIndex];
  } else {
    const newCust: CustomerRecord = {
      id: customerId,
      ...customer,
      total_orders: 1,
      created_at: now,
      updated_at: now
    };
    store.customers.unshift(newCust);
    return newCust;
  }
}

export async function getCustomersFromDb(limit: number = 50, page: number = 1): Promise<{ customers: CustomerRecord[]; total: number }> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const countRes = await sql`SELECT COUNT(*)::int as count FROM noon_customers`;
      const total = countRes[0]?.count || 0;
      const offset = (page - 1) * limit;

      const rows = await sql`
        SELECT * FROM noon_customers 
        ORDER BY updated_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      const customers = rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        country: r.country,
        city: r.city,
        address_line1: r.address_line1,
        address_line2: r.address_line2 || undefined,
        postal_code: r.postal_code || undefined,
        total_orders: Number(r.total_orders),
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at)
      }));

      return { customers, total };
    } catch (err) {
      console.error('Error fetching customers from Vercel DB:', err);
    }
  }

  const store = getMemoryStore();
  const offset = (page - 1) * limit;
  return {
    customers: store.customers.slice(offset, offset + limit),
    total: store.customers.length
  };
}

// -------------------------------------------------------------
// ORDER OPERATIONS
// -------------------------------------------------------------
export async function getOrdersFromDb(filters?: { status?: string; limit?: number; page?: number }): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
  const limit = filters?.limit && filters.limit > 0 ? filters.limit : 50;
  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const offset = (page - 1) * limit;

  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      let orderRows: any[];
      let total = 0;

      if (filters?.status && filters.status.toUpperCase() !== 'ALL') {
        const st = filters.status.toUpperCase();
        const countRes = await sql`SELECT COUNT(*)::int as count FROM noon_orders WHERE UPPER(status) = ${st}`;
        total = countRes[0]?.count || 0;
        orderRows = await sql`
          SELECT * FROM noon_orders 
          WHERE UPPER(status) = ${st} 
          ORDER BY order_date DESC 
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        const countRes = await sql`SELECT COUNT(*)::int as count FROM noon_orders`;
        total = countRes[0]?.count || 0;
        orderRows = await sql`
          SELECT * FROM noon_orders 
          ORDER BY order_date DESC 
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      if (orderRows.length === 0) {
        return { orders: [], total, page, limit };
      }

      const orderIds = orderRows.map(o => o.order_id);
      const itemRows = await sql`
        SELECT * FROM noon_order_items WHERE order_id = ANY(${orderIds})
      `;

      // Group items by order_id
      const itemsByOrderId: Record<string, any[]> = {};
      for (const item of itemRows) {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push(item);
      }

      const orders = orderRows.map(row => mapDbOrder(row, itemsByOrderId[row.order_id] || []));
      return { orders, total, page, limit };
    } catch (err) {
      console.error('Error fetching orders from Vercel DB:', err);
    }
  }

  // Memory fallback
  const store = getMemoryStore();
  let list = [...store.orders];
  if (filters?.status && filters.status.toUpperCase() !== 'ALL') {
    list = list.filter(o => o.status.toUpperCase() === filters.status?.toUpperCase());
  }
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const paginated = list.slice(offset, offset + limit);

  return {
    orders: paginated,
    total: list.length,
    page,
    limit
  };
}

export async function getOrderByIdFromDb(orderId: string): Promise<Order | undefined> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`
        SELECT * FROM noon_orders 
        WHERE order_id = ${orderId} OR order_nr = ${orderId} 
        LIMIT 1
      `;
      if (rows.length > 0) {
        const itemRows = await sql`
          SELECT * FROM noon_order_items WHERE order_id = ${rows[0].order_id}
        `;
        return mapDbOrder(rows[0], itemRows);
      }
      return undefined;
    } catch (err) {
      console.error(`Error fetching order ${orderId} from Vercel DB:`, err);
    }
  }

  const store = getMemoryStore();
  return store.orders.find(o => o.order_id === orderId || o.order_nr === orderId);
}

export async function createOrderInDb(data: {
  customer: CustomerDetails;
  items: { sku: string; quantity: number }[];
  payment_method: 'CARD' | 'COD' | 'NOON_PAY';
}): Promise<Order> {
  // 1. Upsert customer
  const customerRecord = await upsertCustomerInDb(data.customer);

  // 2. Fetch products & compute totals
  let subtotal = 0;
  const populatedItems: Order['items'] = [];

  for (const item of data.items) {
    const product = await getProductBySkuFromDb(item.sku);
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
      // Deduct stock in DB
      await updateProductStockInDb(product.sku, product.stock - item.quantity);
    }
  }

  const vatRate = 0.05;
  const vatAmount = Number((subtotal * vatRate).toFixed(2));
  const shippingFee = subtotal > 100 ? 0 : 15;
  const totalAmount = Number((subtotal + vatAmount + shippingFee).toFixed(2));

  // Determine order number
  let orderNr = String(90400 + Math.floor(Math.random() * 9000));
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const countRes = await sql`SELECT COUNT(*)::int as count FROM noon_orders`;
      orderNr = String(90400 + (countRes[0]?.count || 0) + 1);
    } catch {
      // ignore
    }
  } else {
    orderNr = String(90400 + getMemoryStore().orders.length + 1);
  }

  const orderId = `NON-2026-${orderNr}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    order_id: orderId,
    order_nr: orderNr,
    order_date: now,
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
    created_at: now,
    updated_at: now
  };

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      await sql`
        INSERT INTO noon_orders (
          order_id, order_nr, order_date, status, payment_method,
          payment_status, currency, customer_id, customer_name, customer_email,
          customer_phone, customer_country, customer_city,
          customer_address_line1, customer_address_line2, customer_postal_code,
          subtotal, vat_rate, vat_amount, shipping_fee, discount_amount, total_amount,
          fulfillment_type, fulfillment_awb, fulfillment_carrier, fulfillment_tracking_url,
          created_at, updated_at
        ) VALUES (
          ${newOrder.order_id}, ${newOrder.order_nr}, ${newOrder.order_date},
          ${newOrder.status}, ${newOrder.payment_method}, ${newOrder.payment_status},
          ${newOrder.currency}, ${customerRecord.id}, ${newOrder.customer.name},
          ${newOrder.customer.email}, ${newOrder.customer.phone}, ${newOrder.customer.country},
          ${newOrder.customer.city}, ${newOrder.customer.address_line1},
          ${newOrder.customer.address_line2 || null}, ${newOrder.customer.postal_code || '00000'},
          ${newOrder.totals.subtotal}, ${newOrder.totals.vat_rate}, ${newOrder.totals.vat_amount},
          ${newOrder.totals.shipping_fee}, ${newOrder.totals.discount_amount},
          ${newOrder.totals.total_amount}, ${newOrder.fulfillment.type},
          ${newOrder.fulfillment.awb_number}, ${newOrder.fulfillment.carrier},
          ${newOrder.fulfillment.tracking_url}, ${newOrder.created_at}, ${newOrder.updated_at}
        )
      `;

      for (const item of newOrder.items) {
        await sql`
          INSERT INTO noon_order_items (
            order_id, sku, title, title_ar, quantity, unit_price, total_price, image, category
          ) VALUES (
            ${newOrder.order_id}, ${item.sku}, ${item.title}, ${item.title_ar || null},
            ${item.quantity}, ${item.unit_price}, ${item.total_price},
            ${item.image}, ${item.category || null}
          )
        `;
      }
    } catch (err) {
      console.error('Error inserting new order into Vercel DB:', err);
    }
  }

  // Also push to memory store
  const store = getMemoryStore();
  store.orders.unshift(newOrder);

  // Dispatch background webhook
  dispatchWebhookFromDb('order.created', {
    event: 'order.created',
    timestamp: newOrder.created_at,
    data: newOrder
  }).catch(err => console.error('Webhook dispatch error:', err));

  return newOrder;
}

export async function updateOrderStatusInDb(
  orderId: string,
  newStatus: OrderStatus,
  extra?: { tracking_number?: string; carrier?: string }
): Promise<Order | null> {
  const now = new Date().toISOString();
  let packedAt: string | undefined;
  let shippedAt: string | undefined;
  let deliveredAt: string | undefined;

  if (newStatus === 'PACKED') packedAt = now;
  if (newStatus === 'SHIPPED') shippedAt = now;
  if (newStatus === 'DELIVERED') deliveredAt = now;

  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      await sql`
        UPDATE noon_orders
        SET 
          status = ${newStatus},
          updated_at = CURRENT_TIMESTAMP,
          fulfillment_awb = COALESCE(${extra?.tracking_number || null}, fulfillment_awb),
          fulfillment_carrier = COALESCE(${extra?.carrier || null}, fulfillment_carrier),
          fulfillment_packed_at = COALESCE(${packedAt ? new Date(packedAt) : null}, fulfillment_packed_at),
          fulfillment_shipped_at = COALESCE(${shippedAt ? new Date(shippedAt) : null}, fulfillment_shipped_at),
          fulfillment_delivered_at = COALESCE(${deliveredAt ? new Date(deliveredAt) : null}, fulfillment_delivered_at)
        WHERE order_id = ${orderId} OR order_nr = ${orderId}
      `;

      const updated = await getOrderByIdFromDb(orderId);
      if (updated) {
        dispatchWebhookFromDb('order.status_updated', {
          event: 'order.status_updated',
          order_id: updated.order_id,
          new_status: newStatus,
          timestamp: updated.updated_at,
          data: updated
        }).catch(err => console.error('Webhook status dispatch error:', err));
        return updated;
      }
    } catch (err) {
      console.error(`Error updating order status in Vercel DB for ${orderId}:`, err);
    }
  }

  // Memory fallback
  const store = getMemoryStore();
  const order = store.orders.find(o => o.order_id === orderId || o.order_nr === orderId);
  if (!order) return null;

  order.status = newStatus;
  order.updated_at = now;
  if (extra?.tracking_number) order.fulfillment.awb_number = extra.tracking_number;
  if (extra?.carrier) order.fulfillment.carrier = extra.carrier;
  if (newStatus === 'PACKED') order.fulfillment.packed_at = now;
  if (newStatus === 'SHIPPED') order.fulfillment.shipped_at = now;
  if (newStatus === 'DELIVERED') order.fulfillment.delivered_at = now;

  dispatchWebhookFromDb('order.status_updated', {
    event: 'order.status_updated',
    order_id: order.order_id,
    new_status: newStatus,
    timestamp: order.updated_at,
    data: order
  }).catch(err => console.error('Webhook status dispatch error:', err));

  return order;
}

export async function deleteOrderInDb(orderId: string): Promise<boolean> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      await sql`DELETE FROM noon_order_items WHERE UPPER(order_id) = UPPER(${orderId}) OR order_id = ${orderId}`;
      const rows = await sql`
        DELETE FROM noon_orders 
        WHERE UPPER(order_id) = UPPER(${orderId}) OR order_nr = ${orderId}
        RETURNING order_id
      `;

      const store = getMemoryStore();
      const idx = store.orders.findIndex(o => o.order_id.toUpperCase() === orderId.toUpperCase() || o.order_nr === orderId);
      if (idx !== -1) store.orders.splice(idx, 1);

      return rows.length > 0;
    } catch (err) {
      console.error(`Error deleting order ${orderId} from Vercel DB:`, err);
    }
  }

  const store = getMemoryStore();
  const idx = store.orders.findIndex(o => o.order_id.toUpperCase() === orderId.toUpperCase() || o.order_nr === orderId);
  if (idx !== -1) {
    store.orders.splice(idx, 1);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// SELLER CONFIG OPERATIONS
// -------------------------------------------------------------
export function getSellerConfigSyncFromDb(): SellerConfig {
  return getMemoryStore().sellerConfig;
}

export async function getSellerConfigFromDb(): Promise<SellerConfig> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`SELECT * FROM noon_sellers ORDER BY updated_at DESC NULLS LAST LIMIT 1`;
      if (rows.length > 0) {
        const r = rows[0];
        const fallbackUrl = INITIAL_SELLER_CONFIG.webhook_url || '';
        const webhookUrl = (r.webhook_url && r.webhook_url.trim().length > 0)
          ? r.webhook_url.trim()
          : fallbackUrl;

        // Auto-heal empty webhook_url in Postgres
        if ((!r.webhook_url || r.webhook_url.trim().length === 0) && fallbackUrl) {
          try {
            await sql`
              UPDATE noon_sellers SET
                webhook_url = ${fallbackUrl},
                updated_at = CURRENT_TIMESTAMP
            `;
          } catch (healErr) {
            console.error('Failed to auto-heal webhook_url in DB:', healErr);
          }
        }

        const config: SellerConfig = {
          seller_identifier: r.seller_identifier || INITIAL_SELLER_CONFIG.seller_identifier,
          api_key: r.api_key || INITIAL_SELLER_CONFIG.api_key,
          project_id: r.project_id || INITIAL_SELLER_CONFIG.project_id,
          store_name: r.store_name || INITIAL_SELLER_CONFIG.store_name,
          legal_name: r.legal_name || INITIAL_SELLER_CONFIG.legal_name,
          email: r.email || INITIAL_SELLER_CONFIG.email,
          phone: r.phone || INITIAL_SELLER_CONFIG.phone,
          country: r.country || INITIAL_SELLER_CONFIG.country,
          city: r.city || INITIAL_SELLER_CONFIG.city,
          currency: r.currency || INITIAL_SELLER_CONFIG.currency,
          vat_number: r.vat_number || INITIAL_SELLER_CONFIG.vat_number,
          webhook_url: webhookUrl,
          webhook_secret: r.webhook_secret || INITIAL_SELLER_CONFIG.webhook_secret,
          webhook_events: Array.isArray(r.webhook_events) ? r.webhook_events : INITIAL_SELLER_CONFIG.webhook_events
        };
        getMemoryStore().sellerConfig = config;
        return config;
      }
    } catch (err) {
      console.error('Error fetching seller config from Vercel DB:', err);
    }
  }

  return getMemoryStore().sellerConfig;
}

export async function updateSellerConfigInDb(updates: Partial<SellerConfig>): Promise<SellerConfig> {
  const current = await getSellerConfigFromDb();

  // Filter out undefined and null values
  const cleanUpdates: Partial<SellerConfig> = {};
  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined && val !== null) {
      (cleanUpdates as any)[key] = val;
    }
  }

  const merged: SellerConfig = {
    seller_identifier: cleanUpdates.seller_identifier || current.seller_identifier || INITIAL_SELLER_CONFIG.seller_identifier,
    api_key: cleanUpdates.api_key || current.api_key || INITIAL_SELLER_CONFIG.api_key,
    project_id: cleanUpdates.project_id || current.project_id || INITIAL_SELLER_CONFIG.project_id,
    store_name: cleanUpdates.store_name || current.store_name || INITIAL_SELLER_CONFIG.store_name,
    legal_name: cleanUpdates.legal_name || current.legal_name || INITIAL_SELLER_CONFIG.legal_name,
    email: cleanUpdates.email || current.email || INITIAL_SELLER_CONFIG.email,
    phone: cleanUpdates.phone || current.phone || INITIAL_SELLER_CONFIG.phone,
    country: cleanUpdates.country || current.country || INITIAL_SELLER_CONFIG.country,
    city: cleanUpdates.city || current.city || INITIAL_SELLER_CONFIG.city,
    currency: cleanUpdates.currency || current.currency || INITIAL_SELLER_CONFIG.currency,
    vat_number: cleanUpdates.vat_number !== undefined ? cleanUpdates.vat_number : (current.vat_number || INITIAL_SELLER_CONFIG.vat_number),
    webhook_url: cleanUpdates.webhook_url !== undefined ? cleanUpdates.webhook_url : (current.webhook_url || INITIAL_SELLER_CONFIG.webhook_url),
    webhook_secret: cleanUpdates.webhook_secret !== undefined ? cleanUpdates.webhook_secret : (current.webhook_secret || INITIAL_SELLER_CONFIG.webhook_secret),
    webhook_events: Array.isArray(cleanUpdates.webhook_events) ? cleanUpdates.webhook_events : (current.webhook_events || INITIAL_SELLER_CONFIG.webhook_events)
  };

  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`
        UPDATE noon_sellers SET
          store_name = ${merged.store_name},
          legal_name = ${merged.legal_name},
          email = ${merged.email},
          phone = ${merged.phone},
          api_key = ${merged.api_key},
          webhook_url = ${merged.webhook_url},
          webhook_secret = ${merged.webhook_secret},
          webhook_events = ${JSON.stringify(merged.webhook_events)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      if (rows.length === 0) {
        await sql`
          INSERT INTO noon_sellers (
            seller_identifier, api_key, project_id, store_name,
            legal_name, email, phone, country, city, currency,
            vat_number, webhook_url, webhook_secret, webhook_events
          ) VALUES (
            ${merged.seller_identifier}, ${merged.api_key}, ${merged.project_id},
            ${merged.store_name}, ${merged.legal_name}, ${merged.email},
            ${merged.phone}, ${merged.country}, ${merged.city},
            ${merged.currency}, ${merged.vat_number}, ${merged.webhook_url},
            ${merged.webhook_secret}, ${JSON.stringify(merged.webhook_events)}::jsonb
          )
        `;
      }
    } catch (err) {
      console.error('Error updating seller config in Vercel DB:', err);
      throw err;
    }
  }

  const store = getMemoryStore();
  store.sellerConfig = merged;
  return merged;
}

// -------------------------------------------------------------
// WEBHOOK LOGS & DISPATCH
// -------------------------------------------------------------
export async function getWebhookLogsFromDb(limit: number = 50): Promise<WebhookLog[]> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      const rows = await sql`
        SELECT * FROM noon_webhook_logs 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
      return rows.map(r => ({
        id: r.id,
        event: r.event,
        url: r.url,
        status_code: Number(r.status_code),
        payload: r.payload,
        response_text: r.response_text || '',
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        success: Boolean(r.success)
      }));
    } catch (err) {
      console.error('Error fetching webhook logs from Vercel DB:', err);
    }
  }

  return getMemoryStore().webhookLogs.slice(0, limit);
}

export async function saveWebhookLogInDb(log: WebhookLog): Promise<void> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      await sql`
        INSERT INTO noon_webhook_logs (
          id, seller_identifier, event, url, status_code, payload, response_text, success, created_at
        ) VALUES (
          ${log.id}, 'noon_seller_uae_88921', ${log.event}, ${log.url},
          ${log.status_code}, ${JSON.stringify(log.payload)}::jsonb,
          ${log.response_text}, ${log.success}, ${log.created_at}
        )
      `;
    } catch (err) {
      console.error('Error saving webhook log to Vercel DB:', err);
    }
  }

  const store = getMemoryStore();
  store.webhookLogs.unshift(log);
  if (store.webhookLogs.length > 50) {
    store.webhookLogs.pop();
  }
}

export async function dispatchWebhookFromDb(
  event: string, 
  payload: any, 
  overrideUrl?: string
): Promise<WebhookLog | null> {
  const config = await getSellerConfigFromDb();
  const targetUrl = (overrideUrl && overrideUrl.startsWith('http')) ? overrideUrl : config.webhook_url;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return null;
  }

  if (!overrideUrl && config.webhook_events && !config.webhook_events.includes(event)) {
    return null;
  }

  const logId = 'log_' + Date.now();
  let statusCode = 0;
  let responseText = '';
  let success = false;

  try {
    const res = await fetch(targetUrl, {
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
    url: targetUrl,
    status_code: statusCode,
    payload,
    response_text: responseText.slice(0, 500),
    created_at: new Date().toISOString(),
    success
  };

  await saveWebhookLogInDb(logEntry);
  return logEntry;
}

// -------------------------------------------------------------
// DATABASE STATUS & DIAGNOSTICS
// -------------------------------------------------------------
export async function getDbStats(): Promise<DbStatusInfo> {
  const connStr = getConnectionString();
  const isConfigured = Boolean(connStr);

  if (!isConfigured) {
    const store = getMemoryStore();
    return {
      isConfigured: false,
      isConnected: false,
      provider: 'local_fallback',
      counts: {
        customers: store.customers.length,
        orders: store.orders.length,
        products: store.products.length,
        sellers: 1,
        webhook_logs: store.webhookLogs.length
      },
      message: 'Running in Local Fallback mode. Add POSTGRES_URL to .env.local or link a Vercel Postgres store to enable persistent cloud storage.'
    };
  }

  try {
    const isReady = await ensureDatabaseReady();
    if (!isReady) {
      throw new Error('Database tables could not be initialized');
    }

    const sql = neon(connStr!);
    const [cCount, oCount, pCount, sCount, wCount] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM noon_customers`,
      sql`SELECT COUNT(*)::int as count FROM noon_orders`,
      sql`SELECT COUNT(*)::int as count FROM noon_products`,
      sql`SELECT COUNT(*)::int as count FROM noon_sellers`,
      sql`SELECT COUNT(*)::int as count FROM noon_webhook_logs`
    ]);

    // Parse host from connStr for safe display
    let host = 'vercel-postgres';
    try {
      const parsed = new URL(connStr!);
      host = parsed.hostname;
    } catch {
      // ignore
    }

    return {
      isConfigured: true,
      isConnected: true,
      provider: 'vercel_postgres',
      host,
      databaseName: 'verceldb',
      counts: {
        customers: cCount[0]?.count || 0,
        orders: oCount[0]?.count || 0,
        products: pCount[0]?.count || 0,
        sellers: sCount[0]?.count || 0,
        webhook_logs: wCount[0]?.count || 0
      },
      message: 'Connected to Vercel Postgres (Neon Serverless). Customer and seller data is actively stored in cloud tables.'
    };
  } catch (err: any) {
    const store = getMemoryStore();
    return {
      isConfigured: true,
      isConnected: false,
      provider: 'local_fallback',
      counts: {
        customers: store.customers.length,
        orders: store.orders.length,
        products: store.products.length,
        sellers: 1,
        webhook_logs: store.webhookLogs.length
      },
      message: `Failed to connect to Vercel Postgres: ${err?.message || 'Unknown error'}. Using memory fallback.`
    };
  }
}

// -------------------------------------------------------------
// RESET DATABASE TO SEED
// -------------------------------------------------------------
export async function resetDb(): Promise<void> {
  const ready = await ensureDatabaseReady();
  const connStr = getConnectionString();

  if (ready && connStr) {
    try {
      const sql = neon(connStr);
      await sql`TRUNCATE noon_order_items, noon_orders, noon_products, noon_customers, noon_sellers, noon_webhook_logs CASCADE`;
      isInitialized = false;
      initPromise = null;
      await ensureDatabaseReady();
      return;
    } catch (err) {
      console.error('Error resetting Vercel DB:', err);
    }
  }

  const store = getMemoryStore();
  store.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  store.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  store.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  store.sellerConfig = JSON.parse(JSON.stringify(INITIAL_SELLER_CONFIG));
  store.webhookLogs = [];
}
