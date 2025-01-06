'use client';

import React, { useState, useEffect } from 'react';
import { MinusCircle, PlusCircle, Receipt } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  saveAmount?: number;
}

interface CartItem extends Product {
  quantity: number;
}

const POS = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (_) {
        setError('Error loading products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem && existingItem.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    }
  };

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  const renderProductCard = (product: Product) => {
    const isDeal = product.saveAmount && product.saveAmount > 0;
    
    return (
      <div
        key={product.id}
        className={`${isDeal ? 'bg-yellow-50' : 'bg-white'} rounded-lg shadow-sm p-4 cursor-pointer hover:bg-gray-50`}
        onClick={() => addToCart(product)}
      >
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          )}
          <div className="mt-auto pt-2 flex justify-between items-baseline">
            <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
            {isDeal && (
              <span className="text-green-600 text-sm">Save ${product.saveAmount.toFixed(2)}</span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            In stock: {product.quantity}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(renderProductCard)}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Current Order</h2>
            <Receipt className="w-5 h-5 text-gray-600" />
          </div>

          <div className="space-y-3 mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">${item.price.toFixed(2)} × {item.quantity}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <MinusCircle className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <PlusCircle className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-xl font-bold">${total.toFixed(2)}</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sales', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        items: cart,
                        total,
                        timestamp: new Date().toISOString()
                      }),
                    });
                    
                    if (response.ok) {
                      setCart([]);
                    }
                  } catch (_) {
                    console.error('Error completing sale');
                  }
                }}
                className="w-full h-12 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                disabled={cart.length === 0}
              >
                Complete Sale
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setCart([])}
                  className="flex-1 h-12 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cart.length === 0}
                >
                  Clear
                </button>
                <Link href="/sales-history" className="flex-1">
                  <button className="w-full h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                    View History
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;