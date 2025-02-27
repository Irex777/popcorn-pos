import { Dialog, DialogContent } from "@/components/ui/dialog";
import { type Product } from "@shared/schema";
import { useState } from "react";
import { motion } from "framer-motion";
import ReactImageRotate from "react-360-view";

interface ProductPreviewDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductPreviewDialog({
  product,
  open,
  onOpenChange
}: ProductPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!product) return null;

  // For demo purposes, we'll use a set of numbered images
  // In production, you would have actual product images from different angles
  const imagePaths = Array.from({ length: 36 }, (_, i) => 
    `/product-360/${product.id}/frame_${String(i).padStart(2, '0')}.jpg`
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="relative aspect-square w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <motion.div
                className="h-8 w-8 border-2 border-primary rounded-full border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
          <ReactImageRotate
            amount={36}
            imagePath="/product-360"
            imageFilename="frame"
            ext="jpg"
            dragSpeed={100}
            onLoaded={() => setIsLoading(false)}
          />
        </div>
        <div className="p-4 text-center">
          <h3 className="text-lg font-medium">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag to rotate the product
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
