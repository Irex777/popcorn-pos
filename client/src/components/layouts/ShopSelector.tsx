import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShop } from "@/lib/shop-context";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export function ShopSelector() {
  const { currentShop, setCurrentShop, shops, isLoading } = useShop();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Store className="h-4 w-4 animate-pulse" />
        <span className="animate-pulse">{t('common.shop.loading')}</span>
      </div>
    );
  }

  // Return null if there are no shops
  if (!shops?.length) return null;

  // For non-admin users, filter to only show their assigned shops
  const availableShops = user?.isAdmin ? shops : (shops.filter(shop => user?.shopIds?.includes(shop.id)) || []);

  // Show message if user has no available shops
  if (!availableShops.length) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-destructive">
        <Store className="h-4 w-4" />
        <span>{t('common.shop.noAssigned')}</span>
      </div>
    );
  }

  // If there's only one available shop, just show its name without dropdown
  if (availableShops.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Store className="h-4 w-4" />
        <span>{currentShop?.name || t('common.shop.selectPrompt')}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          <Store className="h-4 w-4" />
          <span className="font-medium">
            {currentShop?.name || t('common.shop.selectPrompt')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableShops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => setCurrentShop(shop)}
            className={`cursor-pointer flex items-center justify-between gap-2 ${
              currentShop?.id === shop.id ? "bg-primary/10 font-medium" : ""
            }`}
          >
            <span>{shop.name}</span>
            {currentShop?.id === shop.id && (
              <span className="text-primary text-sm">{t('common.shop.current')}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
