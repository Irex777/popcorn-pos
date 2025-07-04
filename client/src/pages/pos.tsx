import { useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import ProductGrid from "@/components/pos/ProductGrid";
import CartPanel from "@/components/pos/CartPanel";
import RestaurantCartPanel from "@/components/restaurant/pos/RestaurantCartPanel";

export default function POS() {
  const search = useSearch();
  const { currentShop } = useShop();
  const searchParams = new URLSearchParams(search);
  const preSelectedTableId = searchParams.get('tableId') ? parseInt(searchParams.get('tableId')!) : null;

  // Fetch table data if a table was pre-selected
  const { data: preSelectedTable } = useQuery({
    queryKey: [`/api/shops/${currentShop?.id}/tables/${preSelectedTableId}`],
    queryFn: async () => {
      if (!currentShop?.id || !preSelectedTableId) return null;
      const response = await fetch(`/api/shops/${currentShop.id}/tables`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      const tables = await response.json();
      return tables.find((table: any) => table.id === preSelectedTableId) || null;
    },
    enabled: !!currentShop?.id && !!preSelectedTableId,
  });

  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* Main content area */}
      <div className="flex-1 pb-[180px] md:pb-0 md:min-h-screen">
        <div className="container mx-auto px-2 py-2 md:px-4 md:py-4">
          <ProductGrid />
        </div>
      </div>

      {/* Cart panel - fixed on mobile, side panel on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:relative md:w-[400px] md:border-l md:border-t-0 safe-area-bottom">
        <div className="container mx-auto px-2 md:px-6 md:h-screen md:sticky md:top-0">
          <RestaurantCartPanel preSelectedTable={preSelectedTable} />
        </div>
      </div>
    </div>
  );
}