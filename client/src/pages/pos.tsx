import ProductGrid from "@/components/pos/ProductGrid";
import CartPanel from "@/components/pos/CartPanel";

export default function POS() {
  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      {/* Main content area */}
      <div className="flex-1 pb-[180px] md:pb-0 md:min-h-screen">
        <div className="container mx-auto px-4 py-4 md:px-6 md:py-6">
          <ProductGrid />
        </div>
      </div>

      {/* Cart panel - fixed on mobile, side panel on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:relative md:w-[400px] md:border-l md:border-t-0 safe-area-bottom">
        <div className="container mx-auto px-4 md:px-6 md:h-screen md:sticky md:top-0">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}