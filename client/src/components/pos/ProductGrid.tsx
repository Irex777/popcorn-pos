import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { cartAtom, type CartItem } from "@/lib/store";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProductGrid() {
  const [cart, setCart] = useAtom(cartAtom);
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const addToCart = (product: Product) => {
    setCart(current => {
      const existingItem = current.find(item => item.product.id === product.id);
      if (existingItem) {
        return current.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-40 bg-muted rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {products?.map((product) => (
        <motion.div key={product.id} variants={item}>
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-40 w-full object-cover rounded-md mb-4"
              />
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${Number(product.price).toFixed(2)}
                  </p>
                </div>
                <Button 
                  variant="secondary"
                  onClick={() => addToCart(product)}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
