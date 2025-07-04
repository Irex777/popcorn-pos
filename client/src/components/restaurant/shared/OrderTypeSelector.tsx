import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UtensilsCrossed, Car, Bike } from "lucide-react";

interface OrderTypeSelectorProps {
  value: "dine_in" | "takeout" | "delivery";
  onValueChange: (value: "dine_in" | "takeout" | "delivery") => void;
}

export default function OrderTypeSelector({ value, onValueChange }: OrderTypeSelectorProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "dine_in":
        return <UtensilsCrossed className="h-4 w-4" />;
      case "takeout":
        return <Car className="h-4 w-4" />;
      case "delivery":
        return <Bike className="h-4 w-4" />;
      default:
        return <UtensilsCrossed className="h-4 w-4" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case "dine_in":
        return "Dine In";
      case "takeout":
        return "Takeout";
      case "delivery":
        return "Delivery";
      default:
        return "Dine In";
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          {getIcon(value)}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dine_in">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Dine In
          </div>
        </SelectItem>
        <SelectItem value="takeout">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Takeout
          </div>
        </SelectItem>
        <SelectItem value="delivery">
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4" />
            Delivery
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}