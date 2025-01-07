'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavHeader = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Cinema Popcorn</h1>
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className={`px-4 py-2 rounded-md transition-colors ${
                pathname === '/' ? 'bg-neutral-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              POS
            </Link>
            <Link 
              href="/sales-history"
              className={`px-4 py-2 rounded-md transition-colors ${
                pathname === '/sales-history' ? 'bg-neutral-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              History
            </Link>
            <Link 
              href="/inventory"
              className={`px-4 py-2 rounded-md transition-colors ${
                pathname === '/inventory' ? 'bg-neutral-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Inventory
            </Link>
            <Link 
              href="/settings"
              className={`px-4 py-2 rounded-md transition-colors ${
                pathname === '/settings' ? 'bg-neutral-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavHeader;