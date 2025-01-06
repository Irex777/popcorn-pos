'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  saveAmount?: number;
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSave = async () => {
    if (!editForm) return;

    try {
      const response = await fetch(`/api/products/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update product');

      await fetchProducts();
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Inventory Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Save Amount</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-t">
                  {editingId === product.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          className="w-full px-2 py-1 border rounded"
                          value={editForm?.name || ''}
                          onChange={e => setEditForm(prev => prev ? {...prev, name: e.target.value} : null)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border rounded"
                          value={editForm?.price || 0}
                          onChange={e => setEditForm(prev => prev ? {...prev, price: parseFloat(e.target.value)} : null)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border rounded"
                          value={editForm?.quantity || 0}
                          onChange={e => setEditForm(prev => prev ? {...prev, quantity: parseInt(e.target.value)} : null)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="w-full px-2 py-1 border rounded"
                          value={editForm?.description || ''}
                          onChange={e => setEditForm(prev => prev ? {...prev, description: e.target.value} : null)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border rounded"
                          value={editForm?.saveAmount || 0}
                          onChange={e => setEditForm(prev => prev ? {...prev, saveAmount: parseFloat(e.target.value)} : null)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Save className="w-5 h-5 text-green-600" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3">${product.price.toFixed(2)}</td>
                      <td className="px-4 py-3">{product.quantity}</td>
                      <td className="px-4 py-3">{product.description || '-'}</td>
                      <td className="px-4 py-3">{product.saveAmount ? `$${product.saveAmount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;