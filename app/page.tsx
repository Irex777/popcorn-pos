'use client';

import React, { useState, useEffect } from 'react';
import { MinusCircle, PlusCircle, Receipt } from 'lucide-react';

const POS = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const products = [
    { id: 1, name: 'Small Popcorn', price: 5 },
    { id: 2, name: 'Medium Popcorn', price: 7 },
    { id: 3, name: 'Large Popcorn', price: 9 },
    { id: 4, name: 'Small Soda', price: 3 },
    { id: 5, name: 'Large Soda', price: 4 },
    { id: 6, name: 'Candy', price: 3 },
  ];

  const addToCart = (product) => {
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

  const removeFromCart = (productId) => {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem.quantity === 1) {
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

  const completeSale = () => {
    console.log('Sale completed:', { items: cart, total });
    clearCart();
  };

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 min-h-screen bg-gray-50">
      {/* Products Grid */}
      <div className="md:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <div 
            key={product.id} 
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => addToCart(product)}
          >
            <div className="text-lg font-semibold mb-2">{product.name}</div>
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
  );
};

export default POS;