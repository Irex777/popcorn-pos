import ProductGrid from "@/components/pos/ProductGrid";
import CartPanel from "@/components/pos/CartPanel";

export default function POS() {
  return (
    <div className="pb-[300px] md:pb-0">
      <div className="container mx-auto px-4">
        <ProductGrid />
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:relative md:border-none">
        <div className="container mx-auto px-4">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}