import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shop } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

interface ShopContextType {
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop) => void;
  isLoading: boolean;
  shops: Shop[];
  isRestaurantMode: boolean;
  isShopMode: boolean;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const { user } = useAuth();

  // Debug user info
  useEffect(() => {
    if (user) {
      console.log('Current user:', {
        id: user.id,
        isAdmin: user.isAdmin,
        shopIds: user.shopIds
      });
    }
  }, [user]);

  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops', user?.id],
    enabled: !!user,
    select: (data) => {
      console.log('All shops:', data);
      
      if (!user) return [];
      if (user.isAdmin) {
        console.log('Admin user - returning all shops');
        return data;
      }
      
      // Ensure user.shopIds exists and is an array
      const userShopIds = Array.isArray(user.shopIds) ? user.shopIds : [];
      console.log('User shop IDs:', userShopIds);
      
      // Filter shops that user has access to
      const filteredShops = data.filter(shop => userShopIds.includes(shop.id)) || [];
      console.log('Filtered shops for user:', filteredShops);
      
      return filteredShops;
    },
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  useEffect(() => {
    if (shops.length > 0 && !currentShop) {
      console.log('Setting initial shop:', shops[0]);
      setCurrentShop(shops[0]);
    }
  }, [shops, currentShop]);

  // Business mode helpers
  const isRestaurantMode = currentShop?.businessMode === 'restaurant';
  const isShopMode = !isRestaurantMode;

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        setCurrentShop,
        isLoading,
        shops,
        isRestaurantMode,
        isShopMode,
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
