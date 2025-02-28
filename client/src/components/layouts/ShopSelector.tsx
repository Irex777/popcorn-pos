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

export function ShopSelector() {
  const { currentShop, setCurrentShop, shops } = useShop();
  const { t } = useTranslation();

  if (!currentShop || shops.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          <Store className="h-4 w-4" />
          {currentShop.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {shops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => setCurrentShop(shop)}
            className="cursor-pointer"
          >
            {shop.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
