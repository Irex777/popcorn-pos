import React from 'react';
import SalesHistory from '../components/SalesHistory';

const SalesHistoryPage = () => {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Sales History</h2>
        </div>
        <SalesHistory />
      </div>
    </div>
  );
};

export default SalesHistoryPage;