import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type Order } from "@shared/schema";
import { format } from "date-fns";

export default function History() {
  const { data: orders, isLoading } = useQuery<(Order & { items: any[] })[]>({
    queryKey: ['/api/orders']
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-card rounded-lg p-4 h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Order History</h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {orders?.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">Order #{order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), 'PPpp')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {order.status}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
