import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shop } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

interface ShopContextType {
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop) => void;
  isLoading: boolean;
  shops: Shop[];
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const { user } = useAuth();

  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops'],
    enabled: !!user?.isAdmin,
  });

  useEffect(() => {
    if (shops.length > 0 && !currentShop) {
      setCurrentShop(shops[0]);
    }
  }, [shops, currentShop]);

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        setCurrentShop,
        isLoading,
        shops,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
