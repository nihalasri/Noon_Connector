import { NextRequest } from 'next/server';
import { getSellerConfigSync } from './store';

export interface AuthResult {
  authenticated: boolean;
  error?: string;
  sellerId?: string;
}

export function authenticateRequest(req: NextRequest): AuthResult {
  const config = getSellerConfigSync();

  // Allow bypass with demo=true or in development for easy browser inspection
  const searchParams = req.nextUrl.searchParams;
  if (searchParams.get('demo') === 'true' || searchParams.get('apiKey') === config.api_key) {
    return { authenticated: true, sellerId: config.seller_identifier };
  }

  // Header 1: Authorization: Key <api_key> or Bearer <api_key>
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0].toLowerCase();
      const token = parts[1];
      if ((scheme === 'key' || scheme === 'bearer') && token === config.api_key) {
        return { authenticated: true, sellerId: config.seller_identifier };
      }
    }
  }

  // Header 2: x-api-key or x-id + x-key
  const xApiKey = req.headers.get('x-api-key') || req.headers.get('x-key');
  const xSellerId = req.headers.get('x-seller-identifier') || req.headers.get('x-id');

  if (xApiKey && xApiKey === config.api_key) {
    if (!xSellerId || xSellerId === config.seller_identifier) {
      return { authenticated: true, sellerId: config.seller_identifier };
    }
  }

  return {
    authenticated: false,
    error: 'Unauthorized: Missing or invalid Noon API Key or Seller Identifier. Provide Authorization: Key <api_key> or x-api-key header.'
  };
}
