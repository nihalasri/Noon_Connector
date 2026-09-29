import { Product, Order, SellerConfig, WebhookLog, OrderStatus, CustomerDetails, CustomerRecord, DbStatusInfo } from './types';
import {
  ensureDatabaseReady,
  getProductsFromDb,
  getProductBySkuFromDb,
  updateProductStockInDb,
  updateProductPriceInDb,
  addProductInDb,
  getCustomersFromDb,
  upsertCustomerInDb,
  getOrdersFromDb,
  getOrderByIdFromDb,
  createOrderInDb,
  updateOrderStatusInDb,
  getSellerConfigFromDb,
  getSellerConfigSyncFromDb,
  updateSellerConfigInDb,
  getWebhookLogsFromDb,
  dispatchWebhookFromDb,
  getDbStats,
  resetDb
} from './db';

export {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SELLER_CONFIG,
  INITIAL_CUSTOMERS
} from './initial-data';

// Product operations
export async function getProducts(filters?: { category?: string; search?: string }): Promise<Product[]> {
  return getProductsFromDb(filters);
}

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  return getProductBySkuFromDb(sku);
}

export async function updateProductStock(sku: string, newStock: number): Promise<Product | null> {
  return updateProductStockInDb(sku, newStock);
}

export async function updateProductPrice(sku: string, newPrice: number): Promise<Product | null> {
  return updateProductPriceInDb(sku, newPrice);
}

export async function addProduct(product: Product): Promise<Product> {
  return addProductInDb(product);
}

// Customer operations
export async function getCustomers(limit?: number, page?: number): Promise<{ customers: CustomerRecord[]; total: number }> {
  return getCustomersFromDb(limit, page);
}

export async function upsertCustomer(customer: CustomerDetails): Promise<CustomerRecord> {
  return upsertCustomerInDb(customer);
}

// Order operations
export async function getOrders(filters?: { status?: string; limit?: number; page?: number }): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
  return getOrdersFromDb(filters);
}

export async function getOrderById(orderId: string): Promise<Order | undefined> {
  return getOrderByIdFromDb(orderId);
}

export async function createOrder(data: {
  customer: CustomerDetails;
  items: { sku: string; quantity: number }[];
  payment_method: 'CARD' | 'COD' | 'NOON_PAY';
}): Promise<Order> {
  return createOrderInDb(data);
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  extra?: { tracking_number?: string; carrier?: string }
): Promise<Order | null> {
  return updateOrderStatusInDb(orderId, newStatus, extra);
}

// Seller Config operations
export function getSellerConfigSync(): SellerConfig {
  return getSellerConfigSyncFromDb();
}

export async function getSellerConfig(): Promise<SellerConfig> {
  return getSellerConfigFromDb();
}

export async function updateSellerConfig(updates: Partial<SellerConfig>): Promise<SellerConfig> {
  return updateSellerConfigInDb(updates);
}

// Webhook logging & dispatch
export async function getWebhookLogs(): Promise<WebhookLog[]> {
  return getWebhookLogsFromDb();
}

export async function dispatchWebhook(event: string, payload: any, overrideUrl?: string): Promise<WebhookLog | null> {
  return dispatchWebhookFromDb(event, payload, overrideUrl);
}

// Database stats & reset
export async function resetStore(): Promise<void> {
  return resetDb();
}

export async function getDatabaseStatus(): Promise<DbStatusInfo> {
  return getDbStats();
}

export { ensureDatabaseReady };
