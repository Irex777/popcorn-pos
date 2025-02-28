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
  const { currentShop, setCurrentShop, shops } = useShop();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Only show shop selector if user is admin and there are shops
  if (!user?.isAdmin || !shops?.length) return null;

  // If there's only one shop, just show its name without dropdown
  if (shops.length <= 1) {
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
          {currentShop?.name || t('common.shop.selectPrompt')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {shops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => setCurrentShop(shop)}
            className={`cursor-pointer ${
              currentShop?.id === shop.id ? "bg-primary/10" : ""
            }`}
          >
            {shop.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}