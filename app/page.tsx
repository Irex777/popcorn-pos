'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch {
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

  const clearCart = () => {
    setCart([]);
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          total: total,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit sale');
      }
      setCart([]);
    } catch (error) {
      console.error('Error submitting sale:', error);
      setError('Failed to submit sale');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Products Section */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-300"
              >
                <div className="font-medium text-sm">{product.name}</div>
                <div className="text-lg mt-1">${product.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Order Section - Fixed at bottom on mobile */}
      <div className="border-t bg-white">
        <div className="p-3 border-b">
          <h2 className="font-medium">Current Order</h2>
        </div>

        {/* Cart Items - Scrollable section */}
        <div className="max-h-[40vh] overflow-y-auto p-3">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
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
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total and Actions */}
        <div className="p-3 border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="text-base">Total</span>
            <span className="text-lg font-medium">${total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              className="w-full py-2.5 px-4 bg-white border border-gray-300 rounded text-center text-gray-700 text-sm"
            >
              Clear
            </button>
            <button
              onClick={handleSubmitSale}
              disabled={cart.length === 0 || submitting}
              className="w-full py-2.5 px-4 bg-gray-500 rounded text-center text-white text-sm flex items-center justify-center gap-2"
            >
              {submitting ? 'Processing...' : 'Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;