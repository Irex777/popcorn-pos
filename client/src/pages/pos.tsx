import ProductGrid from "@/components/pos/ProductGrid";
import CartPanel from "@/components/pos/CartPanel";

export default function POS() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ProductGrid />
      </div>
      <div className="lg:col-span-1">
        <CartPanel />
      </div>
    </div>
  );
}
