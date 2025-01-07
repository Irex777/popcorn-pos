'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XIcon, PlusIcon, TrashIcon } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch {
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');
      await fetchProducts();
    } catch {
      setError('Error deleting product');
    }
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
    } catch {
      setError('Error updating product');
    }
  };

  const handleAddNew = async () => {
    const newProduct: Omit<Product, 'id'> = {
      name: 'New Product',
      price: 0,
      quantity: 0,
      description: '',
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) throw new Error('Failed to add product');
      const data = await response.json();
      await fetchProducts();
      handleEdit({...newProduct, id: data.id} as Product);
    } catch {
      setError('Error adding product');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Inventory Management</h2>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <PlusIcon className="w-4 h-4" />
            Add New Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Description</th>
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
                          step="0.01"
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
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="p-2 hover:bg-green-50 rounded text-green-600"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm(null);
                            }}
                            className="p-2 hover:bg-red-50 rounded text-red-600"
                          >
                            <XIcon className="w-5 h-5" />
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
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 hover:bg-blue-50 rounded text-blue-600"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-50 rounded text-red-600"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
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