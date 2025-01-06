import React from 'react';
import SalesHistory from '../components/SalesHistory';

const SalesHistoryPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sales History</h1>
      <SalesHistory />
    </div>
  );
};

export default SalesHistoryPage;