export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  sku: string;
  title: string;
  title_ar?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image: string;
  category?: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  postal_code?: string;
}

export interface OrderTotals {
  subtotal: number;
  vat_rate: number; // e.g. 0.05 (5%)
  vat_amount: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
}

export interface OrderFulfillment {
  type: 'FBP' | 'FBN'; // Fulfilled by Partner vs Fulfilled by Noon
  awb_number: string;
  carrier: string;
  tracking_url: string;
  packed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface Order {
  order_id: string; // e.g. NON-2026-90412
  order_nr: string;
  order_date: string;
  status: OrderStatus;
  payment_method: 'CARD' | 'COD' | 'NOON_PAY';
  payment_status: 'PAID' | 'PENDING';
  currency: string;
  items: OrderItem[];
  customer: CustomerDetails;
  totals: OrderTotals;
  fulfillment: OrderFulfillment;
  created_at: string;
  updated_at: string;
}

export interface Product {
  sku: string;
  title: string;
  title_ar: string;
  brand: string;
  category: string;
  price: number;
  original_price: number;
  currency: string;
  stock: number;
  image: string;
  rating: number;
  rating_count: number;
  is_express: boolean;
  barcode: string;
  description: string;
  featured?: boolean;
}

export interface SellerConfig {
  seller_identifier: string;
  api_key: string;
  project_id: string;
  store_name: string;
  legal_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  currency: string;
  vat_number: string;
  webhook_url: string;
  webhook_secret: string;
  webhook_events: string[];
}

export interface WebhookLog {
  id: string;
  event: string;
  url: string;
  status_code: number;
  payload: any;
  response_text: string;
  created_at: string;
  success: boolean;
}
