import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SalesHistory from '../components/SalesHistory';

const SalesHistoryPage = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales History</h1>
        <Link href="/">
          <button className="px-6 h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to POS
          </button>
        </Link>
      </div>
      <SalesHistory />
    </div>
  );
};

export default SalesHistoryPage;