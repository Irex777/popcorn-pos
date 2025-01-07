'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DollarSign, Clock, Package, Settings } from 'lucide-react';

const NavHeader = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b h-16">
      <div className="h-full max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">Cinema Popcorn</h1>
          <span className="text-gray-500">Main Theater</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              pathname === '/' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            POS
          </Link>
          <Link 
            href="/sales-history"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              pathname === '/sales-history' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            History
          </Link>
          <Link 
            href="/inventory"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              pathname === '/inventory' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory
          </Link>
          <Link 
            href="/settings"
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              pathname === '/settings' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavHeader;