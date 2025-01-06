'use client';

import React, { useState, useEffect } from 'react';
import { MinusCircle, PlusCircle, Receipt } from 'lucide-react';
import SalesHistory from './components/SalesHistory';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity?: number;
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch products');
        }
        const data = await response.json();
        console.log('Fetched products:', data);

        // Sanitize product names
        const sanitizedProducts = data.map((product: Product) => ({
          ...product,
          name: typeof product.name === 'string' ? product.name.trim() : 'Unnamed Product',
        }));

        setProducts(sanitizedProducts);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
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

  const completeSale = async () => {
    try {
      const saleData = {
        items: cart.map(item => ({
          ...item,
          name: typeof item.name === 'string' ? item.name.trim() : 'Unnamed Product',
        })),
        total,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) throw new Error('Failed to record sale');

      clearCart();
    } catch (error) {
      console.error('Error completing sale:', error);
    }
  };

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 p-4 rounded-lg">
          <h2 className="text-red-800 font-medium">Error loading products</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Products Grid */}
        <div className="md:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => addToCart(product)}
            >
              <div className="text-lg font-semibold mb-2">
                {typeof product.name === 'string' ? product.name.trim() : 'Unnamed Product'}
              </div>
              <div className="text-2xl text-green-600">${product.price.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Cart */}
        <div className="md:w-1/3 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Current Order</h2>
            <Receipt className="w-6 h-6 text-gray-600" />
          </div>
          
          <div className="flex-grow overflow-auto max-h-[60vh] space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    ${item.price.toFixed(2)} x {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.id);
                    }}
                  >
                    <MinusCircle className="w-5 h-5 text-red-500" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button 
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                  >
                    <PlusCircle className="w-5 h-5 text-green-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex justify-between text-2xl font-bold mb-6">
              <span>Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear
              </button>
              <button 
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={completeSale}
                disabled={cart.length === 0}
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales History Section */}
      <SalesHistory />
    </div>
  );
};

export default POS;