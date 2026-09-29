'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Package, ShoppingCart, Key, Webhook, Code, Play, 
  RefreshCw, Check, Copy, ExternalLink, Printer, CheckCircle2,
  AlertCircle, ChevronRight, Download, Send, ArrowUpRight, Plus,
  Sliders, Search, Filter, ShieldCheck, Database, Layers, Users, Server, HardDrive
} from 'lucide-react';
import { Order, Product, SellerConfig, WebhookLog, OrderStatus, CustomerRecord, DbStatusInfo } from '@/lib/types';

export default function SellerPortalPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'catalog' | 'customers' | 'database' | 'developer' | 'webhooks' | 'zoho' | 'sandbox'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [config, setConfig] = useState<SellerConfig | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Filter state for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  // Webhook settings form state
  const [webhookUrlInput, setWebhookUrlInput] = useState<string>('');
  const [isSavingWebhook, setIsSavingWebhook] = useState<boolean>(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<{ loading: boolean; message?: string; success?: boolean } | null>(null);

  // Stock edit state
  const [editingStockSku, setEditingStockSku] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  // API Sandbox State
  const [sandboxEndpoint, setSandboxEndpoint] = useState<string>('/api/v1/orders?demo=true');
  const [sandboxMethod, setSandboxMethod] = useState<'GET' | 'POST' | 'PUT'>('GET');
  const [sandboxBody, setSandboxBody] = useState<string>('');
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState<boolean>(false);

  // Base URL calculation
  const [originUrl, setOriginUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Orders
      const ordersRes = await fetch('/api/v1/orders?demo=true');
      const ordersJson = await ordersRes.json();
      if (ordersJson.success) {
        setOrders(ordersJson.data.orders);
      }

      // 2. Fetch Catalog
      const catalogRes = await fetch('/api/v1/catalog?demo=true');
      const catalogJson = await catalogRes.json();
      if (catalogJson.success) {
        setProducts(catalogJson.data.products);
      }

      // 3. Fetch Seller Config
      const configRes = await fetch('/api/v1/seller/config?demo=true');
      const configJson = await configRes.json();
      if (configJson.success) {
        setConfig(configJson.config);
        setWebhookUrlInput(configJson.config.webhook_url || '');
      }

      // 4. Fetch Webhook Logs
      const logsRes = await fetch('/api/v1/webhooks/logs?demo=true');
      const logsJson = await logsRes.json();
      if (logsJson.success) {
        setWebhookLogs(logsJson.logs);
      }

      // 5. Fetch Customers
      const custRes = await fetch('/api/v1/customers?demo=true');
      const custJson = await custRes.json();
      if (custJson.success) {
        setCustomers(custJson.data.customers);
      }

      // 6. Fetch Database Status
      const dbRes = await fetch('/api/v1/db/status');
      const dbJson = await dbRes.json();
      if (dbJson.success) {
        setDbStatus(dbJson.database);
      }
    } catch (err) {
      console.error('Failed to load seller portal data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDatabase = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/v1/db/init', { method: 'POST' });
      const json = await res.json();
      if (json.status) {
        setDbStatus(json.status);
      }
      alert(json.ready ? '✅ Vercel Postgres tables verified & synchronized!' : json.message || 'Database status updated.');
      loadAllData();
    } catch (err: any) {
      alert('Error testing database: ' + err.message);
    } finally {
      setIsCheckingDb(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status?demo=true`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadAllData();
      } else {
        alert('Failed to update order status: ' + data.message);
      }
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleUpdateStock = async (sku: string) => {
    try {
      const res = await fetch('/api/v1/catalog/stock?demo=true', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, stock: Number(newStockVal) })
      });
      const data = await res.json();
      if (data.success) {
        setEditingStockSku(null);
        loadAllData();
      } else {
        alert('Failed to update stock: ' + data.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveWebhookSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWebhook(true);
    try {
      const res = await fetch('/api/v1/seller/config?demo=true', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrlInput })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        alert('Webhook settings saved successfully!');
      } else {
        alert('Failed to save webhook settings: ' + data.message);
      }
    } catch (err: any) {
      alert('Error saving webhook: ' + err.message);
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleSendTestWebhook = async () => {
    setTestWebhookStatus({ loading: true });
    try {
      const res = await fetch('/api/v1/webhooks/test?demo=true', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setTestWebhookStatus({
          loading: false,
          success: true,
          message: data.message
        });
        loadAllData();
      } else {
        setTestWebhookStatus({
          loading: false,
          success: false,
          message: data.message || 'Webhook failed'
        });
      }
    } catch (err: any) {
      setTestWebhookStatus({
        loading: false,
        success: false,
        message: 'Network error sending webhook'
      });
    }
  };

  const handleDownloadCredentials = () => {
    if (!config) return;
    const creds = {
      type: 'service_account',
      project_id: config.project_id,
      seller_identifier: config.seller_identifier,
      api_key: config.api_key,
      auth_uri: `${originUrl}/api/v1/auth/verify`,
      token_uri: `${originUrl}/api/v1/auth/token`,
      marketplace: 'noon_uae_sa_eg',
      client_email: `${config.seller_identifier}@partner.noon.com`,
      created_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(creds, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'store_credentials.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all mock orders and products back to seed state?')) {
      await fetch('/api/v1/reset', { method: 'POST' });
      loadAllData();
    }
  };

  const handleRunSandbox = async () => {
    setIsSandboxRunning(true);
    setSandboxResponse(null);
    try {
      const options: RequestInit = {
        method: sandboxMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${config?.api_key}`,
          'x-seller-identifier': config?.seller_identifier || ''
        }
      };
      if (sandboxMethod !== 'GET' && sandboxBody) {
        options.body = sandboxBody;
      }
      const res = await fetch(sandboxEndpoint, options);
      const json = await res.json();
      setSandboxResponse({ status: res.status, ok: res.ok, data: json });
    } catch (err: any) {
      setSandboxResponse({ error: err.message });
    } finally {
      setIsSandboxRunning(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'ALL') return true;
    return o.status === orderStatusFilter;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totals.total_amount : 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;
  const packedOrdersCount = orders.filter(o => o.status === 'PACKED' || o.status === 'CONFIRMED').length;
  const lowStockCount = products.filter(p => p.stock <= 10).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#1c1f26', color: '#e6edf3' }}>
      
      {/* Top Seller Bar */}
      <header style={{
        background: '#121418',
        borderBottom: '1px solid #282c35',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: '#feee00',
              color: '#000',
              fontWeight: '900',
              fontSize: '18px',
              padding: '2px 10px',
              borderRadius: '4px'
            }}>
              noon
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
              partners
            </span>
            <span style={{
              fontSize: '10px',
              background: '#282d38',
              color: '#a0aab8',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '700'
            }}>
              SELLER LAB v2.4
            </span>
          </div>

          <div style={{ height: '24px', width: '1px', background: '#282c35' }} />

          {/* Store Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#fff', fontWeight: '700' }}>{config?.store_name}</span>
            <span style={{ color: '#6e7687' }}>•</span>
            <span style={{ color: '#9aa5b8', fontFamily: 'monospace' }}>ID: {config?.seller_identifier}</span>
            <span style={{ background: '#1c2e1f', color: '#4ade80', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
              ● LIVE TESTBED
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Vercel Database Status Pill */}
          <button
            onClick={() => setActiveTab('database')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '6px',
              background: dbStatus?.isConnected ? '#0f291e' : '#292010',
              color: dbStatus?.isConnected ? '#4ade80' : '#fbbf24',
              border: `1px solid ${dbStatus?.isConnected ? '#166534' : '#784310'}`,
              cursor: 'pointer'
            }}
            title="Inspect Vercel Database Status"
          >
            <Database size={13} />
            <span>{dbStatus?.isConnected ? 'Vercel Postgres: Active' : 'DB: Local Fallback'}</span>
          </button>

          <button
            onClick={handleResetData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              background: '#242933',
              color: '#c0c8d6',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #333a47',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} /> Reset Demo Data
          </button>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '700',
              background: '#feee00',
              color: '#000',
              padding: '7px 14px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(254, 238, 0, 0.2)'
            }}
          >
            <ShoppingCart size={15} /> Open Noon Marketplace <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Layout: Navigation + Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Sidebar */}
        <aside style={{
          width: '240px',
          background: '#15171d',
          borderRight: '1px solid #282c35',
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'dashboard' ? '#feee00' : 'transparent',
              color: activeTab === 'dashboard' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={17} /> Dashboard
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'orders' ? '#feee00' : 'transparent',
              color: activeTab === 'orders' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Package size={17} /> Orders & Fulfillment
            {pendingOrdersCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: activeTab === 'orders' ? '#000' : '#ea1d2d',
                color: activeTab === 'orders' ? '#feee00' : '#fff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'catalog' ? '#feee00' : 'transparent',
              color: activeTab === 'catalog' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingCart size={17} /> Catalog & Stock
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'customers' ? '#feee00' : 'transparent',
              color: activeTab === 'customers' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={17} /> Customers ({customers.length})
          </button>

          <div style={{ height: '1px', background: '#282c35', margin: '8px 0' }} />
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#687284', padding: '4px 14px', textTransform: 'uppercase' }}>
            Integration & APIs
          </div>

          <button
            onClick={() => setActiveTab('database')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'database' ? '#feee00' : 'transparent',
              color: activeTab === 'database' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Database size={17} /> Vercel Database
            <span style={{
              marginLeft: 'auto',
              background: dbStatus?.isConnected ? '#14532d' : '#713f12',
              color: dbStatus?.isConnected ? '#4ade80' : '#fde047',
              fontSize: '10px',
              fontWeight: '700',
              padding: '1px 5px',
              borderRadius: '4px'
            }}>
              {dbStatus?.isConnected ? 'SQL' : 'LOCAL'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('developer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'developer' ? '#feee00' : 'transparent',
              color: activeTab === 'developer' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Key size={17} /> API Keys & Credentials
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'webhooks' ? '#feee00' : 'transparent',
              color: activeTab === 'webhooks' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Webhook size={17} /> Zoho CRM Webhooks
          </button>

          <button
            onClick={() => setActiveTab('zoho')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'zoho' ? '#feee00' : 'transparent',
              color: activeTab === 'zoho' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Code size={17} /> Zoho Deluge Snippets
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              background: activeTab === 'sandbox' ? '#feee00' : 'transparent',
              color: activeTab === 'sandbox' ? '#000' : '#c0c8d6',
              transition: 'all 0.15s ease'
            }}
          >
            <Play size={17} /> Interactive API Sandbox
          </button>

          {/* Vercel Status Tag */}
          <div style={{ marginTop: 'auto', padding: '12px', background: '#1c1f26', borderRadius: '8px', border: '1px solid #282c35' }}>
            <div style={{ fontSize: '11px', color: '#8c95a6', marginBottom: '4px' }}>Deployment Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4ade80', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Ready for Vercel
            </div>
            <div style={{ fontSize: '10px', color: '#687284', marginTop: '4px' }}>
              Deployable to Vercel with single git push
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Seller Lab Overview</h1>
                <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                  Live metrics for your Noon store and synchronization health with Zoho CRM.
                </p>
              </div>

              {/* Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', marginBottom: '8px' }}>TOTAL REVENUE</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#feee00' }}>
                    AED {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '6px' }}>Across {orders.length} orders</div>
                </div>

                <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', marginBottom: '8px' }}>PENDING ORDERS</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: pendingOrdersCount > 0 ? '#fbbf24' : '#fff' }}>
                    {pendingOrdersCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8c95a6', marginTop: '6px' }}>Awaiting pack & fulfillment</div>
                </div>

                <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', marginBottom: '8px' }}>IN FULFILLMENT</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#60a5fa' }}>
                    {packedOrdersCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8c95a6', marginTop: '6px' }}>Packed & ready for dispatch</div>
                </div>

                <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', marginBottom: '8px' }}>ACTIVE SKUs</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                    {products.length}
                  </div>
                  <div style={{ fontSize: '11px', color: lowStockCount > 0 ? '#f87171' : '#4ade80', marginTop: '6px' }}>
                    {lowStockCount > 0 ? `${lowStockCount} SKUs low in stock` : 'Healthy stock levels'}
                  </div>
                </div>
              </div>

              {/* Zoho Connector Status Card */}
              <div style={{
                background: 'linear-gradient(135deg, #18202c 0%, #151820 100%)',
                border: '1px solid #2a3b50',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                    <ShieldCheck size={18} /> Zoho CRM Extension Ready
                  </div>
                  <p style={{ fontSize: '13px', color: '#c5d0e0', maxWidth: '640px' }}>
                    Use the generated Seller Identifier and API Key in your Zoho CRM connector settings. The REST API endpoints are fully active and respond to standard Noon Partner requests.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('developer')}
                  className="btn-noon-primary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  View API Credentials <ChevronRight size={16} />
                </button>
              </div>

              {/* Recent Orders Table */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #282c35', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Recent Marketplace Orders</h3>
                  <button onClick={() => setActiveTab('orders')} style={{ fontSize: '12px', color: '#feee00', fontWeight: '700' }}>
                    View All Orders →
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#111317', color: '#8c95a6', borderBottom: '1px solid #282c35' }}>
                        <th style={{ padding: '12px 16px' }}>Order ID</th>
                        <th style={{ padding: '12px 16px' }}>Customer</th>
                        <th style={{ padding: '12px 16px' }}>Items</th>
                        <th style={{ padding: '12px 16px' }}>Total Amount</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.order_id} style={{ borderBottom: '1px solid #20242d' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#fff', fontFamily: 'monospace' }}>
                            {o.order_id}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', color: '#fff' }}>{o.customer.name}</div>
                            <div style={{ fontSize: '11px', color: '#8c95a6' }}>{o.customer.city}, {o.customer.country}</div>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#c0c8d6' }}>
                            {o.items.length} item(s)
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#feee00' }}>
                            AED {o.totals.total_amount.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className={`badge-status status-${o.status.toLowerCase()}`}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              onClick={() => {
                                setActiveTab('orders');
                              }}
                              style={{ color: '#60a5fa', fontWeight: '600', fontSize: '12px' }}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS & FULFILLMENT */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Orders & Fulfillment</h1>
                  <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                    Process pending orders, generate Noon AWB shipping labels, and track status.
                  </p>
                </div>
                <Link
                  href="/"
                  className="btn-noon-primary"
                  style={{ fontSize: '13px' }}
                >
                  <Plus size={15} /> Place Test Order on Storefront
                </Link>
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['ALL', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: orderStatusFilter === st ? '#feee00' : '#15171d',
                      color: orderStatusFilter === st ? '#000' : '#9aa5b8',
                      border: '1px solid',
                      borderColor: orderStatusFilter === st ? '#feee00' : '#282c35',
                      cursor: 'pointer'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Orders Table */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#111317', color: '#8c95a6', borderBottom: '1px solid #282c35' }}>
                      <th style={{ padding: '12px 16px' }}>Order ID & Date</th>
                      <th style={{ padding: '12px 16px' }}>Customer & Address</th>
                      <th style={{ padding: '12px 16px' }}>Items Ordered</th>
                      <th style={{ padding: '12px 16px' }}>Total & Payment</th>
                      <th style={{ padding: '12px 16px' }}>AWB / Tracking</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px' }}>Fulfillment Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#687284' }}>
                          No orders found matching filter '{orderStatusFilter}'.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.order_id} style={{ borderBottom: '1px solid #20242d' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#fff', fontFamily: 'monospace' }}>
                              {order.order_id}
                            </div>
                            <div style={{ fontSize: '11px', color: '#7e859b' }}>
                              {new Date(order.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '600', color: '#fff' }}>{order.customer.name}</div>
                            <div style={{ fontSize: '11px', color: '#8c95a6' }}>{order.customer.phone}</div>
                            <div style={{ fontSize: '11px', color: '#687284' }}>{order.customer.address_line1}, {order.customer.city}</div>
                          </td>
                          <td style={{ padding: '14px 16px', maxWidth: '220px' }}>
                            {order.items.map((it, idx) => (
                              <div key={idx} style={{ fontSize: '12px', color: '#c0c8d6', marginBottom: '2px' }}>
                                <strong style={{ color: '#fff' }}>{it.quantity}x</strong> {it.title.slice(0, 24)}...
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#feee00' }}>
                              AED {order.totals.total_amount.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '11px', color: '#8c95a6' }}>
                              {order.payment_method} ({order.payment_status})
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#60a5fa' }}>
                              {order.fulfillment.awb_number}
                            </div>
                            <Link
                              href={`/api/v1/orders/${order.order_id}/awb?format=html&demo=true`}
                              target="_blank"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#feee00', marginTop: '4px' }}
                            >
                              <Printer size={11} /> Print Noon AWB
                            </Link>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={`badge-status status-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {order.status === 'PENDING' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.order_id, 'PACKED')}
                                  style={{
                                    background: '#512da8',
                                    color: '#fff',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}
                                >
                                  Pack & Ready
                                </button>
                              )}
                              {(order.status === 'PACKED' || order.status === 'CONFIRMED') && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.order_id, 'SHIPPED')}
                                  style={{
                                    background: '#2e7d32',
                                    color: '#fff',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}
                                >
                                  Dispatch / Ship
                                </button>
                              )}
                              {order.status === 'SHIPPED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.order_id, 'DELIVERED')}
                                  style={{
                                    background: '#00695c',
                                    color: '#fff',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}
                                >
                                  Mark Delivered
                                </button>
                              )}
                              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.order_id, 'CANCELLED')}
                                  style={{
                                    background: 'transparent',
                                    color: '#f87171',
                                    border: '1px solid #451b1d',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10px'
                                  }}
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATALOG & STOCK */}
          {activeTab === 'catalog' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Catalog & Stock Control</h1>
                  <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                    Adjust SKU inventory levels to test two-way stock synchronization with Zoho CRM.
                  </p>
                </div>
              </div>

              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#111317', color: '#8c95a6', borderBottom: '1px solid #282c35' }}>
                      <th style={{ padding: '12px 16px' }}>SKU & Barcode</th>
                      <th style={{ padding: '12px 16px' }}>Product</th>
                      <th style={{ padding: '12px 16px' }}>Category</th>
                      <th style={{ padding: '12px 16px' }}>Selling Price</th>
                      <th style={{ padding: '12px 16px' }}>Stock Available</th>
                      <th style={{ padding: '12px 16px' }}>Quick Adjust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.sku} style={{ borderBottom: '1px solid #20242d' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#fff', fontFamily: 'monospace' }}>{prod.sku}</div>
                          <div style={{ fontSize: '11px', color: '#687284' }}>EAN: {prod.barcode}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={prod.image} alt={prod.title} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div>
                              <div style={{ fontWeight: '600', color: '#fff' }}>{prod.title.slice(0, 36)}...</div>
                              <div style={{ fontSize: '11px', color: '#8c95a6' }}>{prod.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9aa5b8' }}>
                          {prod.category}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#feee00' }}>
                          AED {prod.price.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {editingStockSku === prod.sku ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                value={newStockVal}
                                onChange={(e) => setNewStockVal(parseInt(e.target.value, 10) || 0)}
                                style={{ width: '70px', padding: '4px 8px', background: '#242933', border: '1px solid #444c5d', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                              />
                              <button
                                onClick={() => handleUpdateStock(prod.sku)}
                                style={{ background: '#4ade80', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingStockSku(null)}
                                style={{ color: '#888', fontSize: '11px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span style={{
                              fontWeight: '700',
                              color: prod.stock <= 5 ? '#f87171' : prod.stock <= 15 ? '#fbbf24' : '#4ade80'
                            }}>
                              {prod.stock} units
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {editingStockSku !== prod.sku && (
                            <button
                              onClick={() => {
                                setEditingStockSku(prod.sku);
                                setNewStockVal(prod.stock);
                              }}
                              style={{
                                background: '#242933',
                                color: '#c0c8d6',
                                border: '1px solid #333a47',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}
                            >
                              Edit Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DEVELOPER & API KEYS */}
          {activeTab === 'developer' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>API Keys & Partner Credentials</h1>
                <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                  Use these credentials to authenticate your Zoho CRM connector with this Noon emulator.
                </p>
              </div>

              {/* Credentials Box */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Official Noon Partner Service Account</h3>
                  <button
                    onClick={handleDownloadCredentials}
                    className="btn-noon-primary"
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                  >
                    <Download size={15} /> Download store_credentials.json
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Base API URL */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      BASE API URL (Host on Vercel or localhost)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        readOnly
                        value={originUrl}
                        style={{ flex: 1, padding: '10px 14px', background: '#0d0e12', border: '1px solid #282c35', borderRadius: '6px', color: '#feee00', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        onClick={() => copyToClipboard(originUrl, 'url')}
                        className="btn-outline"
                        style={{ background: '#242933', color: '#fff', borderColor: '#3a4150' }}
                      >
                        {copiedKey === 'url' ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Seller Identifier */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      SELLER IDENTIFIER (x-seller-identifier)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        readOnly
                        value={config?.seller_identifier || ''}
                        style={{ flex: 1, padding: '10px 14px', background: '#0d0e12', border: '1px solid #282c35', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        onClick={() => copyToClipboard(config?.seller_identifier || '', 'seller_id')}
                        className="btn-outline"
                        style={{ background: '#242933', color: '#fff', borderColor: '#3a4150' }}
                      >
                        {copiedKey === 'seller_id' ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      API SECRET KEY (Authorization: Key &lt;api_key&gt; OR x-api-key)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        readOnly
                        value={config?.api_key || ''}
                        style={{ flex: 1, padding: '10px 14px', background: '#0d0e12', border: '1px solid #282c35', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        onClick={() => copyToClipboard(config?.api_key || '', 'api_key')}
                        className="btn-outline"
                        style={{ background: '#242933', color: '#fff', borderColor: '#3a4150' }}
                      >
                        {copiedKey === 'api_key' ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Project ID */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      PROJECT ID
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        readOnly
                        value={config?.project_id || ''}
                        style={{ flex: 1, padding: '10px 14px', background: '#0d0e12', border: '1px solid #282c35', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                      <button
                        onClick={() => copyToClipboard(config?.project_id || '', 'project_id')}
                        className="btn-outline"
                        style={{ background: '#242933', color: '#fff', borderColor: '#3a4150' }}
                      >
                        {copiedKey === 'project_id' ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Supported Endpoints Table */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>
                  Supported Noon Partner REST Endpoints
                </h3>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#0d0e12', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#4ade80', fontWeight: '800', width: '50px' }}>GET</span>
                    <span style={{ color: '#feee00' }}>/api/v1/seller/profile</span>
                    <span style={{ color: '#8c95a6', marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '12px' }}>Verify connection & credentials</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#0d0e12', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#4ade80', fontWeight: '800', width: '50px' }}>GET</span>
                    <span style={{ color: '#feee00' }}>/api/v1/orders?status=PENDING&amp;limit=50</span>
                    <span style={{ color: '#8c95a6', marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '12px' }}>Fetch paginated marketplace orders</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#0d0e12', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#4ade80', fontWeight: '800', width: '50px' }}>GET</span>
                    <span style={{ color: '#feee00' }}>/api/v1/orders/[orderId]</span>
                    <span style={{ color: '#8c95a6', marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '12px' }}>Get order details & customer address</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#0d0e12', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#60a5fa', fontWeight: '800', width: '50px' }}>PUT</span>
                    <span style={{ color: '#feee00' }}>/api/v1/orders/[orderId]/status</span>
                    <span style={{ color: '#8c95a6', marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '12px' }}>Update status (e.g. PACKED, SHIPPED)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#0d0e12', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#4ade80', fontWeight: '800', width: '50px' }}>GET</span>
                    <span style={{ color: '#feee00' }}>/api/v1/catalog</span>
                    <span style={{ color: '#8c95a6', marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '12px' }}>Fetch product inventory & pricing</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#0d0e12', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#60a5fa', fontWeight: '800', width: '50px' }}>PUT</span>
                    <span style={{ color: '#feee00' }}>/api/v1/catalog/stock</span>
                    <span style={{ color: '#8c95a6', marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '12px' }}>Sync stock from Zoho CRM/Inventory</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ZOHO CRM WEBHOOKS */}
          {activeTab === 'webhooks' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Zoho CRM Webhook Manager</h1>
                <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                  Configure your Zoho CRM / Deluge Webhook URL to receive instant notifications when new Noon orders are placed.
                </p>
              </div>

              {/* Webhook Configuration Form */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
                <form onSubmit={handleSaveWebhookSettings}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'block', marginBottom: '6px' }}>
                      Target Zoho Webhook Endpoint URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://crm.zoho.com/crm/WebHook?id=... or Deluge webhook URL"
                      value={webhookUrlInput}
                      onChange={(e) => setWebhookUrlInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#0d0e12',
                        border: '1px solid #282c35',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#687284', marginTop: '4px', display: 'block' }}>
                      When a customer buys on the Noon storefront, a POST request is sent to this URL with the order details.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="submit"
                      disabled={isSavingWebhook}
                      className="btn-noon-primary"
                      style={{ fontSize: '13px', padding: '8px 18px' }}
                    >
                      {isSavingWebhook ? 'Saving...' : 'Save Webhook URL'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendTestWebhook}
                      disabled={testWebhookStatus?.loading || !webhookUrlInput}
                      className="btn-outline"
                      style={{
                        background: '#242933',
                        color: '#fff',
                        borderColor: '#3a4150',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Send size={14} />
                      {testWebhookStatus?.loading ? 'Sending Test...' : 'Send Test Webhook to Zoho'}
                    </button>

                    {testWebhookStatus && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: testWebhookStatus.success ? '#4ade80' : '#f87171'
                      }}>
                        {testWebhookStatus.message}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Webhook Dispatch History */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>
                  Recent Webhook Delivery Logs
                </h3>

                {webhookLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#687284', fontSize: '13px' }}>
                    No webhooks dispatched yet. Enter a Webhook URL and click "Send Test Webhook", or place an order on the storefront!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {webhookLogs.map(log => (
                      <div
                        key={log.id}
                        style={{
                          background: '#0d0e12',
                          border: '1px solid #282c35',
                          borderRadius: '8px',
                          padding: '14px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: log.success ? '#1c2e1f' : '#3d1618',
                              color: log.success ? '#4ade80' : '#f87171',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              HTTP {log.status_code || 'ERROR'}
                            </span>
                            <span style={{ fontWeight: '700', color: '#feee00', fontFamily: 'monospace' }}>
                              {log.event}
                            </span>
                          </div>
                          <span style={{ color: '#687284' }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ color: '#8c95a6', wordBreak: 'break-all', marginBottom: '6px' }}>
                          Target: {log.url}
                        </div>
                        {log.response_text && (
                          <div style={{ color: '#a0aab8', background: '#181b22', padding: '6px 10px', borderRadius: '4px', fontFamily: 'monospace' }}>
                            Response: {log.response_text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ZOHO DELUGE SNIPPETS */}
          {activeTab === 'zoho' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Zoho Sigma & Deluge Integration Kit</h1>
                <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                  Copy and paste these verified Zoho Deluge scripts directly into your Zoho CRM extension functions.
                </p>
              </div>

              {/* Step by step checklist */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#feee00', marginBottom: '12px' }}>
                  Guide: Building Your Extension in Zoho Sigma / Zoho Developer
                </h3>
                <ol style={{ paddingLeft: '20px', fontSize: '13px', color: '#c0c8d6', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.6 }}>
                  <li>In <strong>Zoho Developer / Sigma</strong>, create a new extension: <em>"Noon Marketplace Connector for Zoho CRM"</em>.</li>
                  <li>In <strong>Extension Settings</strong>, create 3 configuration fields:
                    <ul style={{ paddingLeft: '20px', marginTop: '4px', color: '#9aa5b8' }}>
                      <li><code>noon_base_url</code> (Default: <code>{originUrl}</code>)</li>
                      <li><code>noon_seller_id</code> (Default: <code>{config?.seller_identifier}</code>)</li>
                      <li><code>noon_api_key</code> (Default: <code>{config?.api_key}</code>)</li>
                    </ul>
                  </li>
                  <li>Create a <strong>Scheduled Deluge Function</strong> (runs every 15 minutes) or a <strong>Webhook Listener</strong> using the scripts below.</li>
                  <li>Test the connection, verify that Noon orders map to Zoho CRM <strong>Sales Orders / Deals</strong>, and submit to <strong>Zoho Marketplace</strong>!</li>
                </ol>
              </div>

              {/* Snippet 1: Fetch Orders Deluge */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                    1. Deluge Function: Fetch Noon Orders & Create in Zoho CRM
                  </h4>
                  <button
                    onClick={() => copyToClipboard(`// Deluge Function to fetch Noon Orders and insert into Zoho CRM
noonBaseUrl = "${originUrl}";
noonApiKey = "${config?.api_key}";
noonSellerId = "${config?.seller_identifier}";

headers = Map();
headers.put("Authorization", "Key " + noonApiKey);
headers.put("x-seller-identifier", noonSellerId);
headers.put("Content-Type", "application/json");

// 1. Fetch pending/confirmed orders from Noon API
response = invokeurl
[
	url: noonBaseUrl + "/api/v1/orders?status=PENDING&limit=20"
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
		
		// Map customer to Zoho CRM Contact
		contactMap = Map();
		contactMap.put("Last_Name", customer.get("name"));
		contactMap.put("Email", customer.get("email"));
		contactMap.put("Phone", customer.get("phone"));
		contactMap.put("Mailing_City", customer.get("city"));
		contactMap.put("Mailing_Street", customer.get("address_line1"));
		
		createContact = zoho.crm.createRecord("Contacts", contactMap);
		
		// Map order to Zoho CRM Deal / Sales Order
		dealMap = Map();
		dealMap.put("Deal_Name", "Noon Order - " + orderId);
		dealMap.put("Amount", totals.get("total_amount"));
		dealMap.put("Stage", "Closed Won");
		dealMap.put("Description", "AWB: " + order.get("fulfillment").get("awb_number"));
		
		createDeal = zoho.crm.createRecord("Deals", dealMap);
		info "Created Zoho Deal for " + orderId;
	}
}`, 'deluge1')}
                    className="btn-outline"
                    style={{ background: '#242933', color: '#fff', borderColor: '#3a4150', fontSize: '12px' }}
                  >
                    {copiedKey === 'deluge1' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />} Copy Deluge Script
                  </button>
                </div>

                <pre className="code-block" style={{ maxHeight: '280px' }}>
{`// Deluge Function to fetch Noon Orders and insert into Zoho CRM
noonBaseUrl = "${originUrl}";
noonApiKey = "${config?.api_key}";
noonSellerId = "${config?.seller_identifier}";

headers = Map();
headers.put("Authorization", "Key " + noonApiKey);
headers.put("x-seller-identifier", noonSellerId);
headers.put("Content-Type", "application/json");

// 1. Fetch pending/confirmed orders from Noon API
response = invokeurl
[
	url: noonBaseUrl + "/api/v1/orders?status=PENDING&limit=20"
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
		
		// Map customer to Zoho CRM Contact
		contactMap = Map();
		contactMap.put("Last_Name", customer.get("name"));
		contactMap.put("Email", customer.get("email"));
		contactMap.put("Phone", customer.get("phone"));
		contactMap.put("Mailing_City", customer.get("city"));
		contactMap.put("Mailing_Street", customer.get("address_line1"));
		
		createContact = zoho.crm.createRecord("Contacts", contactMap);
		
		// Map order to Zoho CRM Deal / Sales Order
		dealMap = Map();
		dealMap.put("Deal_Name", "Noon Order - " + orderId);
		dealMap.put("Amount", totals.get("total_amount"));
		dealMap.put("Stage", "Closed Won");
		dealMap.put("Description", "AWB: " + order.get("fulfillment").get("awb_number"));
		
		createDeal = zoho.crm.createRecord("Deals", dealMap);
		info "Created Zoho Deal for " + orderId;
	}
}`}
                </pre>
              </div>

              {/* Snippet 2: Two-way Stock Sync */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                    2. Deluge Function: Sync Zoho CRM / Inventory Stock to Noon
                  </h4>
                  <button
                    onClick={() => copyToClipboard(`// Deluge Function to push stock updates from Zoho CRM to Noon
noonBaseUrl = "${originUrl}";
noonApiKey = "${config?.api_key}";

sku = "N53346824A"; // SKU from Zoho CRM Product
currentStock = 25;  // Stock quantity in Zoho CRM

bodyMap = Map();
bodyMap.put("sku", sku);
bodyMap.put("stock", currentStock);

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

info syncResponse;`, 'deluge2')}
                    className="btn-outline"
                    style={{ background: '#242933', color: '#fff', borderColor: '#3a4150', fontSize: '12px' }}
                  >
                    {copiedKey === 'deluge2' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />} Copy Stock Script
                  </button>
                </div>

                <pre className="code-block" style={{ maxHeight: '240px' }}>
{`// Deluge Function to push stock updates from Zoho CRM to Noon
noonBaseUrl = "${originUrl}";
noonApiKey = "${config?.api_key}";

sku = "N53346824A"; // SKU from Zoho CRM Product
currentStock = 25;  // Stock quantity in Zoho CRM

bodyMap = Map();
bodyMap.put("sku", sku);
bodyMap.put("stock", currentStock);

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

info syncResponse;`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 7: INTERACTIVE API SANDBOX */}
          {activeTab === 'sandbox' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>Interactive API Console</h1>
                <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                  Execute real HTTP requests against the Noon emulator right inside your browser.
                </p>
              </div>

              {/* Endpoint Preset Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setSandboxEndpoint('/api/v1/seller/profile?demo=true');
                    setSandboxMethod('GET');
                    setSandboxBody('');
                  }}
                  style={{ padding: '6px 12px', background: '#242933', borderRadius: '4px', fontSize: '12px', color: '#c0c8d6' }}
                >
                  Verify Profile (GET)
                </button>
                <button
                  onClick={() => {
                    setSandboxEndpoint('/api/v1/orders?demo=true');
                    setSandboxMethod('GET');
                    setSandboxBody('');
                  }}
                  style={{ padding: '6px 12px', background: '#242933', borderRadius: '4px', fontSize: '12px', color: '#c0c8d6' }}
                >
                  List Orders (GET)
                </button>
                <button
                  onClick={() => {
                    setSandboxEndpoint('/api/v1/catalog?demo=true');
                    setSandboxMethod('GET');
                    setSandboxBody('');
                  }}
                  style={{ padding: '6px 12px', background: '#242933', borderRadius: '4px', fontSize: '12px', color: '#c0c8d6' }}
                >
                  List Catalog (GET)
                </button>
                <button
                  onClick={() => {
                    setSandboxEndpoint('/api/v1/catalog/stock?demo=true');
                    setSandboxMethod('PUT');
                    setSandboxBody(JSON.stringify({ sku: 'N53346824A', stock: 20 }, null, 2));
                  }}
                  style={{ padding: '6px 12px', background: '#242933', borderRadius: '4px', fontSize: '12px', color: '#c0c8d6' }}
                >
                  Update Stock (PUT)
                </button>
              </div>

              {/* Request bar */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <select
                    value={sandboxMethod}
                    onChange={(e: any) => setSandboxMethod(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      background: '#0d0e12',
                      border: '1px solid #282c35',
                      borderRadius: '6px',
                      color: sandboxMethod === 'GET' ? '#4ade80' : '#60a5fa',
                      fontWeight: '800',
                      fontSize: '13px'
                    }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>

                  <input
                    type="text"
                    value={sandboxEndpoint}
                    onChange={(e) => setSandboxEndpoint(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: '#0d0e12',
                      border: '1px solid #282c35',
                      borderRadius: '6px',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}
                  />

                  <button
                    onClick={handleRunSandbox}
                    disabled={isSandboxRunning}
                    className="btn-noon-primary"
                    style={{ padding: '10px 24px', fontSize: '13px' }}
                  >
                    {isSandboxRunning ? 'Calling...' : 'Send Request'}
                  </button>
                </div>

                {sandboxMethod !== 'GET' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#8c95a6', display: 'block', marginBottom: '6px' }}>
                      Request JSON Body:
                    </label>
                    <textarea
                      rows={4}
                      value={sandboxBody}
                      onChange={(e) => setSandboxBody(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#0d0e12',
                        border: '1px solid #282c35',
                        borderRadius: '6px',
                        color: '#4ade80',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                )}

                {/* Response Box */}
                {sandboxResponse && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '700' }}>STATUS:</span>
                      <span style={{
                        background: sandboxResponse.ok ? '#1c2e1f' : '#3d1618',
                        color: sandboxResponse.ok ? '#4ade80' : '#f87171',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '800'
                      }}>
                        {sandboxResponse.status || 'ERROR'}
                      </span>
                    </div>
                    <pre className="code-block" style={{ maxHeight: '360px' }}>
                      {JSON.stringify(sandboxResponse.data || sandboxResponse.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={24} style={{ color: '#feee00' }} /> Customer Directory & CRM Profiles
                  </h1>
                  <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                    Stored customer details, shipping destinations, contact numbers, and purchase frequency from Vercel Database.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={loadAllData}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      background: '#242933',
                      color: '#c0c8d6',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid #333a47',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} /> Refresh Customers
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600' }}>TOTAL CUSTOMERS</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#feee00', marginTop: '6px' }}>
                    {customers.length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '4px' }}>Persisted in noon_customers table</div>
                </div>

                <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600' }}>TOTAL ORDERS PLACED</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#60a5fa', marginTop: '6px' }}>
                    {orders.length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8c95a6', marginTop: '4px' }}>Linked via customer email & ID</div>
                </div>

                <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#8c95a6', fontWeight: '600' }}>DATABASE STATUS</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: dbStatus?.isConnected ? '#4ade80' : '#fbbf24', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: dbStatus?.isConnected ? '#4ade80' : '#fbbf24', display: 'inline-block' }} />
                    {dbStatus?.isConnected ? 'Vercel Postgres' : 'Local Fallback'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8c95a6', marginTop: '4px' }}>
                    {dbStatus?.isConnected ? 'Neon Cloud Serverless' : 'In-memory persistent singleton'}
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div style={{
                background: '#15171d',
                border: '1px solid #282c35',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Search size={16} style={{ color: '#687284' }} />
                <input
                  type="text"
                  placeholder="Search customer by name, email, phone, or city..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    width: '100%'
                  }}
                />
                {customerSearch && (
                  <button
                    onClick={() => setCustomerSearch('')}
                    style={{ background: 'transparent', border: 'none', color: '#8c95a6', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Customers Table */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#121418', borderBottom: '1px solid #282c35', color: '#8c95a6', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '14px 18px' }}>Customer Name</th>
                      <th style={{ padding: '14px 18px' }}>Contact Details</th>
                      <th style={{ padding: '14px 18px' }}>Shipping Address</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>Total Orders</th>
                      <th style={{ padding: '14px 18px' }}>Registered At</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers
                      .filter(c => {
                        if (!customerSearch) return true;
                        const s = customerSearch.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(s) ||
                          c.email.toLowerCase().includes(s) ||
                          c.phone.toLowerCase().includes(s) ||
                          c.city.toLowerCase().includes(s)
                        );
                      })
                      .map((cust) => (
                        <tr key={cust.id || cust.email} style={{ borderBottom: '1px solid #20242c' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: '700', color: '#ffffff' }}>{cust.name}</div>
                            <div style={{ fontSize: '11px', color: '#687284', fontFamily: 'monospace' }}>ID: {cust.id}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ color: '#c0c8d6' }}>{cust.email}</div>
                            <div style={{ fontSize: '11px', color: '#8c95a6' }}>{cust.phone}</div>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#c0c8d6' }}>
                            <div>{cust.address_line1}</div>
                            <div style={{ fontSize: '11px', color: '#8c95a6' }}>{cust.city}, {cust.country} {cust.postal_code ? `(${cust.postal_code})` : ''}</div>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <span style={{
                              background: '#1c2438',
                              color: '#60a5fa',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontWeight: '700',
                              fontSize: '12px'
                            }}>
                              {cust.total_orders || 1}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#8c95a6', fontSize: '12px' }}>
                            {new Date(cust.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setOrderStatusFilter('ALL');
                                setActiveTab('orders');
                              }}
                              style={{
                                background: '#242933',
                                border: '1px solid #333a47',
                                color: '#feee00',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              View Orders
                            </button>
                          </td>
                        </tr>
                      ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#8c95a6' }}>
                          No customer records found. Place an order on the Noon Storefront to register customer details.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: VERCEL DATABASE */}
          {activeTab === 'database' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={24} style={{ color: '#feee00' }} /> Vercel Database & Schema Explorer
                  </h1>
                  <p style={{ fontSize: '14px', color: '#9aa5b8' }}>
                    Postgres storage powering both Noon Customer Storefront and Seller Lab operations.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleTestDatabase}
                    disabled={isCheckingDb}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      background: '#feee00',
                      color: '#000',
                      fontWeight: '700',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} className={isCheckingDb ? 'animate-spin' : ''} />
                    {isCheckingDb ? 'Checking...' : 'Test Connection & Sync'}
                  </button>

                  <button
                    onClick={handleResetData}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      background: '#242933',
                      color: '#c0c8d6',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid #333a47',
                      cursor: 'pointer'
                    }}
                  >
                    Re-seed Tables
                  </button>
                </div>
              </div>

              {/* Status Alert Card */}
              <div style={{
                background: dbStatus?.isConnected ? 'linear-gradient(135deg, #102a1c 0%, #151820 100%)' : 'linear-gradient(135deg, #2a2210 0%, #151820 100%)',
                border: `1px solid ${dbStatus?.isConnected ? '#1b4d2e' : '#594411'}`,
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '28px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Server size={22} style={{ color: dbStatus?.isConnected ? '#4ade80' : '#fbbf24' }} />
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                      {dbStatus?.isConnected ? 'Vercel Postgres (Neon Serverless) Active' : 'Local Fallback Storage Active'}
                    </span>
                  </div>
                  <span style={{
                    background: dbStatus?.isConnected ? '#14532d' : '#713f12',
                    color: dbStatus?.isConnected ? '#4ade80' : '#fde047',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}>
                    {dbStatus?.isConnected ? 'CONNECTED' : 'LOCAL EMULATION'}
                  </span>
                </div>

                <p style={{ color: '#c5d0e0', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>
                  {dbStatus?.message || (dbStatus?.isConnected
                    ? 'All customer details, orders, seller settings, products, and webhook logs are securely synchronized with Vercel Postgres.'
                    : 'The app is running on in-memory storage. When deployed to Vercel, attach a Vercel Postgres store in your dashboard or set POSTGRES_URL to persist cloud tables.')}
                </p>

                <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#9aa5b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                  <div>
                    <span style={{ color: '#687284' }}>Provider: </span>
                    <strong style={{ color: '#fff' }}>{dbStatus?.provider === 'vercel_postgres' ? 'Vercel Postgres (Neon)' : 'In-Memory Singleton'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#687284' }}>Host: </span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{dbStatus?.host || 'localhost'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#687284' }}>Database: </span>
                    <strong style={{ color: '#fff' }}>{dbStatus?.databaseName || 'noon_emulator'}</strong>
                  </div>
                </div>
              </div>

              {/* 6 Database Tables Grid */}
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={18} style={{ color: '#feee00' }} /> Synchronized Database Tables
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {/* Table 1: Customers */}
                  <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#feee00', fontWeight: '700', fontSize: '13px' }}>noon_customers</span>
                      <span style={{ background: '#242933', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                        {dbStatus?.counts.customers ?? customers.length} rows
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c95a6', lineHeight: '1.5' }}>
                      Customer profiles, names, email addresses, UAE/KSA phone numbers, and delivery addresses.
                    </div>
                  </div>

                  {/* Table 2: Sellers */}
                  <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#feee00', fontWeight: '700', fontSize: '13px' }}>noon_sellers</span>
                      <span style={{ background: '#242933', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                        {dbStatus?.counts.sellers ?? 1} row
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c95a6', lineHeight: '1.5' }}>
                      Seller Lab configuration, API tokens, Zoho CRM webhook secrets, and legal entity details.
                    </div>
                  </div>

                  {/* Table 3: Products */}
                  <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#feee00', fontWeight: '700', fontSize: '13px' }}>noon_products</span>
                      <span style={{ background: '#242933', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                        {dbStatus?.counts.products ?? products.length} rows
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c95a6', lineHeight: '1.5' }}>
                      Noon Marketplace catalog items, barcodes, categories, prices, and live inventory stock.
                    </div>
                  </div>

                  {/* Table 4: Orders */}
                  <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#feee00', fontWeight: '700', fontSize: '13px' }}>noon_orders</span>
                      <span style={{ background: '#242933', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                        {dbStatus?.counts.orders ?? orders.length} rows
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c95a6', lineHeight: '1.5' }}>
                      Marketplace orders, payment methods (Card/COD), order status, and Noon Express AWB tracking.
                    </div>
                  </div>

                  {/* Table 5: Order Items */}
                  <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#feee00', fontWeight: '700', fontSize: '13px' }}>noon_order_items</span>
                      <span style={{ background: '#242933', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                        Active
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c95a6', lineHeight: '1.5' }}>
                      Normalized line items for each order, containing ordered SKU, title, unit price, and quantities.
                    </div>
                  </div>

                  {/* Table 6: Webhook Logs */}
                  <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#feee00', fontWeight: '700', fontSize: '13px' }}>noon_webhook_logs</span>
                      <span style={{ background: '#242933', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                        {dbStatus?.counts.webhook_logs ?? webhookLogs.length} rows
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c95a6', lineHeight: '1.5' }}>
                      HTTP audit logs for webhook dispatches sent to Zoho CRM or custom seller notification endpoints.
                    </div>
                  </div>
                </div>
              </div>

              {/* Vercel Postgres Setup Instructions */}
              <div style={{ background: '#15171d', border: '1px solid #282c35', borderRadius: '10px', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
                  ☁️ How to Connect Vercel Postgres (2 Minutes)
                </h3>
                <ol style={{ paddingLeft: '20px', fontSize: '13px', color: '#c0c8d6', lineHeight: '1.8' }}>
                  <li>Deploy this project to your Vercel account or import from GitHub.</li>
                  <li>In your Vercel Project Dashboard, navigate to the <strong>Storage</strong> tab.</li>
                  <li>Click <strong>Create Database</strong> and select <strong>Postgres</strong> (powered by Neon).</li>
                  <li>Click <strong>Connect to Project</strong>. Vercel automatically sets <code style={{ color: '#feee00', background: '#242933', padding: '2px 6px', borderRadius: '3px' }}>POSTGRES_URL</code>.</li>
                  <li>The emulator will automatically run table creation and seed all initial products, orders, and seller credentials upon deployment!</li>
                </ol>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
