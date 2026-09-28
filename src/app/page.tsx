'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, ShoppingCart, User, MapPin, ChevronRight, CheckCircle2, 
  Star, Zap, ShieldCheck, Truck, RefreshCw, X, ArrowRight,
  ExternalLink, Building2, SlidersHorizontal, Plus, Minus
} from 'lucide-react';
import { Product, Order } from '@/lib/types';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function MarketplaceHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState<string>('Hamdan Al-Maktoum');
  const [customerEmail, setCustomerEmail] = useState<string>('hamdan.maktoum@example.ae');
  const [customerPhone, setCustomerPhone] = useState<string>('+971 50 789 4512');
  const [customerCity, setCustomerCity] = useState<string>('Dubai');
  const [customerAddress, setCustomerAddress] = useState<string>('Villa 45, Al Wasl Road, Jumeirah 1');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'COD'>('CARD');

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      const url = selectedCategory === 'All' 
        ? '/api/v1/catalog?demo=true' 
        : `/api/v1/catalog?category=${encodeURIComponent(selectedCategory)}&demo=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const categories = ['All', 'Mobiles', 'Electronics', 'Fragrances', 'Beauty', 'Home', 'Fashion'];

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.sku === product.sku);
      if (existing) {
        return prev.map(item => 
          item.product.sku === product.sku 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart(prev => 
      prev
        .map(item => {
          if (item.product.sku === sku) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartVat = Number((cartSubtotal * 0.05).toFixed(2));
  const shippingFee = cartSubtotal > 100 || cartSubtotal === 0 ? 0 : 15;
  const cartGrandTotal = Number((cartSubtotal + cartVat + shippingFee).toFixed(2));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          country: 'United Arab Emirates',
          city: customerCity,
          address_line1: customerAddress,
          postal_code: '00000'
        },
        items: cart.map(item => ({
          sku: item.product.sku,
          quantity: item.quantity
        })),
        payment_method: paymentMethod
      };

      const res = await fetch('/api/v1/orders?demo=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.order);
        setCart([]);
        setIsCheckoutOpen(false);
        fetchProducts(); // Refresh stock numbers
      } else {
        alert('Order failed: ' + data.message);
      }
    } catch (err: any) {
      alert('Error placing order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f7fa' }}>
      {/* Top Banner Notice */}
      <div style={{
        background: '#1A1A1A',
        color: '#FFFFFF',
        padding: '6px 16px',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#feee00', color: '#000', padding: '1px 6px', fontWeight: '800', borderRadius: '2px', fontSize: '10px' }}>
            NOON PARTNER TESTBED
          </span>
          <span>Fully functional Noon Storefront & Seller API Emulator for Zoho CRM integration testing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link 
            href="/seller" 
            style={{ 
              color: '#feee00', 
              fontWeight: '700', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              textDecoration: 'underline' 
            }}
          >
            <Building2 size={13} /> Switch to Noon Seller Lab
          </Link>
          <span style={{ color: '#888' }}>|</span>
          <span style={{ color: '#ccc', cursor: 'pointer' }}>العربية</span>
        </div>
      </div>

      {/* Main Header */}
      <header style={{
        background: '#feee00',
        padding: '12px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <div style={{
                background: '#000',
                color: '#feee00',
                fontWeight: '900',
                fontSize: '26px',
                padding: '2px 14px',
                borderRadius: '6px',
                letterSpacing: '-1px'
              }}>
                noon
              </div>
            </Link>

            {/* Deliver To */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              background: 'rgba(255,255,255,0.7)',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer'
            }}>
              <MapPin size={16} color="#1a1a1a" />
              <div>
                <span style={{ color: '#666', fontSize: '11px', display: 'block', lineHeight: 1 }}>Deliver to</span>
                <strong style={{ color: '#1a1a1a' }}>Dubai, Downtown</strong>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: '640px', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>
              <input
                type="text"
                placeholder="What are you looking for? (e.g. iPhone 16, Sauvage, Sony...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <button style={{
                background: '#000',
                color: '#fff',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* User Nav & Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/seller"
              className="btn-noon-dark"
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                background: '#1a1a1a',
                color: '#feee00',
                border: '1px solid #333'
              }}
            >
              <Building2 size={15} /> Seller Lab
            </Link>

            <button 
              onClick={() => setIsCartOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                color: '#1a1a1a',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                position: 'relative'
              }}
            >
              <ShoppingCart size={18} />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span style={{
                  background: '#ea1d2d',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  marginLeft: '2px'
                }}>
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Categories Bar */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e6e8ee', padding: '8px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: selectedCategory === cat ? '700' : '500',
                background: selectedCategory === cat ? '#1a1a1a' : '#f1f2f6',
                color: selectedCategory === cat ? '#feee00' : '#4a4d57',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38ae04', fontWeight: '700' }}>
            <Zap size={14} fill="#38ae04" /> Free Next-Day Delivery on orders over 100 AED
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container" style={{ flex: 1, padding: '24px 16px' }}>
        
        {/* Promotional Hero Carousel / Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2E3342 100%)',
          borderRadius: '12px',
          padding: '32px 40px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <div style={{ maxWidth: '600px', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#feee00',
              color: '#000000',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '800',
              marginBottom: '14px'
            }}>
              <Zap size={14} fill="#000" /> MEGA DEALS • UAE & KSA
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1.2, marginBottom: '10px' }}>
              Ramadan Super Sale: Up to 60% OFF
            </h1>
            <p style={{ color: '#c5c9d6', fontSize: '15px', marginBottom: '20px' }}>
              Top flagship smartphones, luxury fragrances, and home appliances. Test placing an order to trigger real-time Zoho CRM sync!
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setSelectedCategory('Mobiles')} 
                className="btn-noon-primary"
              >
                Shop Flagship Mobiles <ArrowRight size={16} />
              </button>
              <Link href="/seller" className="btn-outline" style={{ background: 'transparent', color: '#fff', borderColor: '#555' }}>
                Open Seller Portal
              </Link>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            maxWidth: '320px',
            zIndex: 2
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#feee00', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
              <ShieldCheck size={18} /> Zoho CRM Integration Active
            </div>
            <p style={{ fontSize: '12px', color: '#d0d4e4', lineHeight: 1.5 }}>
              Orders placed here appear immediately in <strong>Noon Seller Lab</strong> and trigger dispatch webhooks to your <strong>Zoho CRM Deluge function</strong>.
            </p>
          </div>
        </div>

        {/* Section Heading */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>
              {selectedCategory === 'All' ? 'Recommended For You' : `${selectedCategory} Collection`}
            </h2>
            <p style={{ fontSize: '13px', color: '#7e859b' }}>
              Showing {filteredProducts.length} authentic Middle East products
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              background: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e4ec',
              color: '#38ae04',
              fontWeight: '700'
            }}>
              <CheckCircle2 size={14} /> 100% Genuine Products
            </span>
          </div>
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {filteredProducts.map(product => (
            <div
              key={product.sku}
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #edf0f5',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              {/* Product Image */}
              <div style={{
                position: 'relative',
                paddingTop: '80%',
                background: '#f9f9fb',
                overflow: 'hidden'
              }}>
                <img
                  src={product.image}
                  alt={product.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                {product.is_express && (
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                    <span className="badge-express">
                      noon <span>express</span>
                    </span>
                  </div>
                )}
                {product.original_price > product.price && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#38ae04',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#7e859b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {product.brand} • <span style={{ color: '#9aa0b0' }}>SKU: {product.sku}</span>
                </div>
                
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  lineHeight: 1.4,
                  height: '40px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  marginBottom: '8px'
                }}>
                  {product.title}
                </h3>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    background: '#eaf8e7',
                    color: '#008a00',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    <span>{product.rating}</span>
                    <Star size={10} fill="#008a00" color="#008a00" />
                  </div>
                  <span style={{ fontSize: '11px', color: '#8c93a6' }}>({product.rating_count})</span>
                  
                  {product.stock <= 10 && product.stock > 0 && (
                    <span style={{ fontSize: '11px', color: '#ea1d2d', fontWeight: '700', marginLeft: 'auto' }}>
                      Only {product.stock} left!
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: '700', marginLeft: 'auto' }}>
                      Out of stock
                    </span>
                  )}
                </div>

                {/* Price */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f0f2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a1a' }}>AED</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>
                      {product.price.toLocaleString()}
                    </span>
                    {product.original_price > product.price && (
                      <span style={{ fontSize: '12px', color: '#9ba1b4', textDecoration: 'line-through' }}>
                        {product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      background: product.stock > 0 ? '#feee00' : '#e0e2e8',
                      color: product.stock > 0 ? '#1a1a1a' : '#888',
                      fontWeight: '700',
                      fontSize: '13px',
                      padding: '8px 0',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ShoppingCart size={15} />
                    {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: '#ffffff',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
            animation: 'slideInRight 0.25s ease-out'
          }}>
            {/* Cart Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e6e8ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#feee00'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="#1a1a1a" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1a1a1a' }}>
                  Shopping Cart ({totalCartCount})
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ color: '#1a1a1a' }}>
                <X size={22} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7e859b' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p style={{ fontWeight: '600', fontSize: '16px', color: '#1a1a1a' }}>Your cart is empty</p>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>Explore products and add items to your cart</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cart.map(item => (
                    <div
                      key={item.product.sku}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #edf0f5',
                        background: '#fcfcfd'
                      }}
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', lineHeight: 1.3, marginBottom: '4px' }}>
                          {item.product.title}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                          SKU: {item.product.sku}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a1a' }}>
                            AED {(item.product.price * item.quantity).toLocaleString()}
                          </span>
                          
                          {/* Qty Controls */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #d5d9e2',
                            borderRadius: '4px',
                            background: '#fff'
                          }}>
                            <button
                              onClick={() => updateQuantity(item.product.sku, -1)}
                              style={{ padding: '4px 8px', color: '#555' }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ padding: '0 8px', fontSize: '12px', fontWeight: '700' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.sku, 1)}
                              style={{ padding: '4px 8px', color: '#555' }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer Summary */}
            {cart.length > 0 && (
              <div style={{
                padding: '20px',
                borderTop: '1px solid #e6e8ee',
                background: '#fafafc'
              }}>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>Subtotal</span>
                    <span>AED {cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>UAE VAT (5%)</span>
                    <span>AED {cartVat.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>Shipping</span>
                    <span style={{ color: shippingFee === 0 ? '#38ae04' : '#666', fontWeight: shippingFee === 0 ? '700' : 'normal' }}>
                      {shippingFee === 0 ? 'FREE' : `AED ${shippingFee}`}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#1a1a1a',
                    borderTop: '1px dashed #d5d9e2',
                    paddingTop: '8px'
                  }}>
                    <span>Total Amount</span>
                    <span>AED {cartGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="btn-noon-primary"
                  style={{ width: '100%', padding: '12px 0', fontSize: '15px' }}
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: '#feee00',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>
                  Noon Express Checkout
                </h3>
                <span style={{ fontSize: '12px', color: '#555' }}>
                  Order will sync to Noon Seller Lab and Zoho CRM
                </span>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)}>
                <X size={20} color="#1a1a1a" />
              </button>
            </div>

            <form onSubmit={handleCheckout} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d5d9e2', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Phone Number (UAE/KSA) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d5d9e2', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d5d9e2', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Emirate / City *
                  </label>
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d5d9e2', borderRadius: '6px', fontSize: '13px', background: '#fff' }}
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Riyadh">Riyadh (KSA)</option>
                    <option value="Jeddah">Jeddah (KSA)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Building, street, apartment..."
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d5d9e2', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#555', display: 'block', marginBottom: '8px' }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: paymentMethod === 'CARD' ? '2px solid #1a1a1a' : '1px solid #d5d9e2',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: paymentMethod === 'CARD' ? '#fcfcfd' : '#fff'
                  }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Credit / Debit Card</span>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: paymentMethod === 'COD' ? '2px solid #1a1a1a' : '1px solid #d5d9e2',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: paymentMethod === 'COD' ? '#fcfcfd' : '#fff'
                  }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Cash on Delivery</span>
                  </label>
                </div>
              </div>

              {/* Order total banner */}
              <div style={{
                background: '#f8f9fc',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Total to pay:</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>
                  AED {cartGrandTotal.toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-noon-primary"
                style={{ width: '100%', padding: '14px 0', fontSize: '15px' }}
              >
                {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#eaf8e7',
              color: '#38ae04',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', marginBottom: '6px' }}>
              Order Placed Successfully!
            </h3>
            <p style={{ color: '#7e859b', fontSize: '14px', marginBottom: '20px' }}>
              Thank you for shopping on noon. Your order has been registered in the partner database.
            </p>

            <div style={{
              background: '#f8f9fb',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Order ID:</span>
                <strong>{orderSuccess.order_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Air Waybill (AWB):</span>
                <strong style={{ color: '#0070f3' }}>{orderSuccess.fulfillment.awb_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Total Amount:</span>
                <strong>AED {orderSuccess.totals.total_amount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Status:</span>
                <span className="badge-status status-pending">PENDING SELLER PACK</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setOrderSuccess(null)}
                className="btn-outline"
                style={{ flex: 1 }}
              >
                Continue Shopping
              </button>
              <Link
                href="/seller"
                className="btn-noon-primary"
                style={{ flex: 1 }}
              >
                View in Seller Lab <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e6e8ee', padding: '36px 0 20px', marginTop: 'auto' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '30px' }}>
            <div>
              <div style={{ background: '#000', color: '#feee00', fontWeight: '900', fontSize: '20px', padding: '2px 10px', display: 'inline-block', borderRadius: '4px', marginBottom: '12px' }}>
                noon
              </div>
              <p style={{ fontSize: '13px', color: '#7e859b', lineHeight: 1.5 }}>
                The Middle East's homegrown online marketplace replica built for Zoho CRM extension development.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a', textTransform: 'uppercase', marginBottom: '12px' }}>
                Noon Partner APIs
              </h4>
              <ul style={{ listStyle: 'none', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#555' }}>
                <li><Link href="/api/v1/orders?demo=true" target="_blank" style={{ color: '#0070f3' }}>/api/v1/orders</Link></li>
                <li><Link href="/api/v1/catalog?demo=true" target="_blank" style={{ color: '#0070f3' }}>/api/v1/catalog</Link></li>
                <li><Link href="/api/v1/seller/profile?demo=true" target="_blank" style={{ color: '#0070f3' }}>/api/v1/seller/profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a', textTransform: 'uppercase', marginBottom: '12px' }}>
                Zoho CRM Developer Kit
              </h4>
              <ul style={{ listStyle: 'none', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#555' }}>
                <li><Link href="/seller" style={{ color: '#1a1a1a', fontWeight: '600' }}>Seller Lab Dashboard</Link></li>
                <li><Link href="/seller" style={{ color: '#1a1a1a', fontWeight: '600' }}>Zoho Deluge Code Snippets</Link></li>
                <li><Link href="/seller" style={{ color: '#1a1a1a', fontWeight: '600' }}>Download store_credentials.json</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a', textTransform: 'uppercase', marginBottom: '12px' }}>
                Fulfillment & Coverage
              </h4>
              <p style={{ fontSize: '13px', color: '#7e859b' }}>
                Simulating Fulfilled by Partner (FBP) & Fulfilled by Noon (FBN) across UAE (Dubai, Abu Dhabi), Saudi Arabia (Riyadh, Jeddah), and Egypt.
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f2f7', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#9aa0b0' }}>
            <span>© 2026 noon replica. Designed for Zoho Sigma / Marketplace Partner Testing.</span>
            <span>Vercel Serverless Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
