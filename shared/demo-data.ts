// Demo data structures for creating populated shops and restaurants

export interface DemoDataConfig {
  type: 'shop' | 'restaurant';
  name: string;
  address?: string;
  includeHistory: boolean;
  historyDays: number; // Number of days of historical data to generate
}

export interface DemoCategory {
  name: string;
  description: string;
  color: string;
}

export interface DemoProduct {
  name: string;
  price: number;
  categoryIndex: number; // Index in categories array
  imageUrl?: string;
  initialStock?: number;
  requiresKitchen?: boolean;
}

export interface DemoTable {
  tableNumber: number;
  capacity: number;
  section?: string;
  x?: number;
  y?: number;
}

export interface DemoOrder {
  orderType: 'dine_in' | 'takeout' | 'delivery';
  tableId?: number;
  items: Array<{
    productIndex: number; // Index in products array
    quantity: number;
    specialRequests?: string;
  }>;
  specialInstructions?: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: 'cash' | 'card';
  createdDaysAgo: number; // For historical data
  guestCount?: number;
}

// Shop demo data - simple retail/cafe setup
export const SHOP_DEMO_DATA = {
  categories: [
    {
      name: "Hot Beverages",
      description: "Coffee, tea, and hot drinks",
      color: "#8B4513"
    },
    {
      name: "Cold Beverages", 
      description: "Refreshing cold drinks",
      color: "#1E90FF"
    },
    {
      name: "Pastries",
      description: "Fresh baked goods",
      color: "#DAA520"
    },
    {
      name: "Snacks",
      description: "Light snacks and treats",
      color: "#FF6347"
    }
  ] as DemoCategory[],

  products: [
    // Hot Beverages
    { name: "Espresso", price: 2.50, categoryIndex: 0, requiresKitchen: true },
    { name: "Cappuccino", price: 3.50, categoryIndex: 0, requiresKitchen: true },
    { name: "Latte", price: 4.00, categoryIndex: 0, requiresKitchen: true },
    { name: "Green Tea", price: 2.00, categoryIndex: 0, requiresKitchen: true },
    { name: "Hot Chocolate", price: 3.00, categoryIndex: 0, requiresKitchen: true },
    
    // Cold Beverages
    { name: "Iced Coffee", price: 3.50, categoryIndex: 1, requiresKitchen: false },
    { name: "Coca Cola", price: 2.50, categoryIndex: 1, requiresKitchen: false, initialStock: 50 },
    { name: "Orange Juice", price: 3.00, categoryIndex: 1, requiresKitchen: false, initialStock: 30 },
    { name: "Sparkling Water", price: 2.00, categoryIndex: 1, requiresKitchen: false, initialStock: 40 },
    
    // Pastries
    { name: "Croissant", price: 2.50, categoryIndex: 2, requiresKitchen: true, initialStock: 20 },
    { name: "Muffin", price: 3.00, categoryIndex: 2, requiresKitchen: false, initialStock: 15 },
    { name: "Danish Pastry", price: 3.50, categoryIndex: 2, requiresKitchen: false, initialStock: 12 },
    
    // Snacks
    { name: "Sandwich", price: 6.50, categoryIndex: 3, requiresKitchen: true },
    { name: "Chips", price: 2.00, categoryIndex: 3, requiresKitchen: false, initialStock: 25 },
    { name: "Energy Bar", price: 3.50, categoryIndex: 3, requiresKitchen: false, initialStock: 18 }
  ] as DemoProduct[],

  orders: [
    // Recent orders
    {
      orderType: 'takeout' as const,
      items: [{ productIndex: 1, quantity: 1 }, { productIndex: 10, quantity: 1 }],
      status: 'completed' as const,
      paymentMethod: 'card' as const,
      createdDaysAgo: 0
    },
    {
      orderType: 'takeout' as const,
      items: [{ productIndex: 0, quantity: 2 }, { productIndex: 6, quantity: 1 }],
      status: 'completed' as const,
      paymentMethod: 'cash' as const,
      createdDaysAgo: 0
    },
    // Historical orders for last 7 days
    {
      orderType: 'takeout' as const,
      items: [{ productIndex: 2, quantity: 1 }, { productIndex: 12, quantity: 1 }],
      status: 'completed' as const,
      paymentMethod: 'card' as const,
      createdDaysAgo: 1
    },
    {
      orderType: 'takeout' as const,
      items: [{ productIndex: 5, quantity: 1 }, { productIndex: 11, quantity: 2 }],
      status: 'completed' as const,
      paymentMethod: 'cash' as const,
      createdDaysAgo: 2
    }
  ] as DemoOrder[]
};

// Restaurant demo data - full-service restaurant setup
export const RESTAURANT_DEMO_DATA = {
  categories: [
    {
      name: "Appetizers",
      description: "Start your meal with these delicious appetizers",
      color: "#FF6B6B"
    },
    {
      name: "Main Courses",
      description: "Hearty and satisfying main dishes",
      color: "#4ECDC4"
    },
    {
      name: "Desserts",
      description: "Sweet treats to end your meal",
      color: "#45B7D1"
    },
    {
      name: "Beverages",
      description: "Drinks and refreshments",
      color: "#96CEB4"
    },
    {
      name: "Salads",
      description: "Fresh and healthy salad options",
      color: "#FFEAA7"
    }
  ] as DemoCategory[],

  products: [
    // Appetizers
    { name: "Bruschetta", price: 8.50, categoryIndex: 0, requiresKitchen: true },
    { name: "Calamari Rings", price: 12.00, categoryIndex: 0, requiresKitchen: true },
    { name: "Buffalo Wings", price: 10.50, categoryIndex: 0, requiresKitchen: true },
    { name: "Mozzarella Sticks", price: 9.00, categoryIndex: 0, requiresKitchen: true },
    
    // Main Courses
    { name: "Grilled Salmon", price: 24.00, categoryIndex: 1, requiresKitchen: true },
    { name: "Ribeye Steak", price: 32.00, categoryIndex: 1, requiresKitchen: true },
    { name: "Chicken Parmesan", price: 19.50, categoryIndex: 1, requiresKitchen: true },
    { name: "Pasta Carbonara", price: 16.00, categoryIndex: 1, requiresKitchen: true },
    { name: "Vegetarian Pizza", price: 15.50, categoryIndex: 1, requiresKitchen: true },
    { name: "Fish and Chips", price: 17.00, categoryIndex: 1, requiresKitchen: true },
    
    // Desserts
    { name: "Tiramisu", price: 7.50, categoryIndex: 2, requiresKitchen: true },
    { name: "Chocolate Cake", price: 6.50, categoryIndex: 2, requiresKitchen: true },
    { name: "Crème Brûlée", price: 8.00, categoryIndex: 2, requiresKitchen: true },
    
    // Beverages
    { name: "House Wine", price: 6.00, categoryIndex: 3, requiresKitchen: false },
    { name: "Craft Beer", price: 5.50, categoryIndex: 3, requiresKitchen: false },
    { name: "Fresh Lemonade", price: 4.00, categoryIndex: 3, requiresKitchen: false },
    { name: "Coffee", price: 3.50, categoryIndex: 3, requiresKitchen: true },
    
    // Salads
    { name: "Caesar Salad", price: 12.00, categoryIndex: 4, requiresKitchen: true },
    { name: "Greek Salad", price: 11.50, categoryIndex: 4, requiresKitchen: true },
    { name: "Garden Salad", price: 9.50, categoryIndex: 4, requiresKitchen: true }
  ] as DemoProduct[],

  tables: [
    // Main dining area
    { tableNumber: 1, capacity: 2, section: "Main Dining", x: 100, y: 100 },
    { tableNumber: 2, capacity: 4, section: "Main Dining", x: 200, y: 100 },
    { tableNumber: 3, capacity: 4, section: "Main Dining", x: 300, y: 100 },
    { tableNumber: 4, capacity: 6, section: "Main Dining", x: 100, y: 200 },
    { tableNumber: 5, capacity: 2, section: "Main Dining", x: 200, y: 200 },
    
    // Terrace area
    { tableNumber: 6, capacity: 4, section: "Terrace", x: 400, y: 100 },
    { tableNumber: 7, capacity: 4, section: "Terrace", x: 500, y: 100 },
    { tableNumber: 8, capacity: 8, section: "Terrace", x: 400, y: 200 },
    
    // Bar area
    { tableNumber: 9, capacity: 2, section: "Bar", x: 100, y: 300 },
    { tableNumber: 10, capacity: 2, section: "Bar", x: 200, y: 300 }
  ] as DemoTable[],

  orders: [
    // Recent dine-in orders
    {
      orderType: 'dine_in' as const,
      tableId: 2,
      guestCount: 4,
      items: [
        { productIndex: 0, quantity: 2 }, // Bruschetta
        { productIndex: 4, quantity: 2 }, // Grilled Salmon
        { productIndex: 6, quantity: 2 }, // Chicken Parmesan
        { productIndex: 13, quantity: 2 }, // House Wine
        { productIndex: 10, quantity: 1 } // Tiramisu
      ],
      specialInstructions: "No onions on the salmon please",
      status: 'completed' as const,
      paymentMethod: 'card' as const,
      createdDaysAgo: 0
    },
    {
      orderType: 'dine_in' as const,
      tableId: 5,
      guestCount: 2,
      items: [
        { productIndex: 17, quantity: 1 }, // Caesar Salad
        { productIndex: 8, quantity: 1 }, // Vegetarian Pizza
        { productIndex: 15, quantity: 2 }, // Fresh Lemonade
        { productIndex: 11, quantity: 1 } // Chocolate Cake
      ],
      status: 'completed' as const,
      paymentMethod: 'cash' as const,
      createdDaysAgo: 0
    },
    // Takeout orders
    {
      orderType: 'takeout' as const,
      items: [
        { productIndex: 7, quantity: 1 }, // Pasta Carbonara
        { productIndex: 16, quantity: 1 } // Coffee
      ],
      status: 'completed' as const,
      paymentMethod: 'card' as const,
      createdDaysAgo: 0
    },
    // Historical orders for analytics
    {
      orderType: 'dine_in' as const,
      tableId: 4,
      guestCount: 6,
      items: [
        { productIndex: 1, quantity: 3 }, // Calamari
        { productIndex: 5, quantity: 2 }, // Ribeye Steak
        { productIndex: 4, quantity: 1 }, // Grilled Salmon
        { productIndex: 6, quantity: 3 }, // Chicken Parmesan
        { productIndex: 14, quantity: 4 }, // Craft Beer
        { productIndex: 12, quantity: 2 } // Crème Brûlée
      ],
      specialInstructions: "Birthday celebration - please bring candles",
      status: 'completed' as const,
      paymentMethod: 'card' as const,
      createdDaysAgo: 1
    },
    {
      orderType: 'delivery' as const,
      items: [
        { productIndex: 8, quantity: 2 }, // Vegetarian Pizza
        { productIndex: 18, quantity: 1 }, // Greek Salad
        { productIndex: 15, quantity: 2 } // Fresh Lemonade
      ],
      status: 'completed' as const,
      paymentMethod: 'card' as const,
      createdDaysAgo: 2
    }
  ] as DemoOrder[]
};

// Helper function to generate more historical orders
export function generateHistoricalOrders(
  baseOrders: DemoOrder[], 
  days: number, 
  ordersPerDay: { min: number; max: number } = { min: 5, max: 15 }
): DemoOrder[] {
  const historicalOrders: DemoOrder[] = [];
  
  for (let day = 3; day <= days; day++) {
    const ordersToday = Math.floor(Math.random() * (ordersPerDay.max - ordersPerDay.min + 1)) + ordersPerDay.min;
    
    for (let i = 0; i < ordersToday; i++) {
      // Pick a random base order to use as template
      const baseOrder = baseOrders[Math.floor(Math.random() * baseOrders.length)];
      
      // Randomize some aspects
      const order: DemoOrder = {
        ...baseOrder,
        createdDaysAgo: day,
        // Randomly modify items quantities
        items: baseOrder.items.map(item => ({
          ...item,
          quantity: Math.max(1, item.quantity + Math.floor(Math.random() * 3) - 1)
        }))
      };
      
      historicalOrders.push(order);
    }
  }
  
  return historicalOrders;
}

export function getDemoData(config: DemoDataConfig) {
  const baseData = config.type === 'shop' ? SHOP_DEMO_DATA : RESTAURANT_DEMO_DATA;
  
  let orders = [...baseData.orders];
  
  if (config.includeHistory && config.historyDays > 3) {
    const historicalOrders = generateHistoricalOrders(
      baseData.orders,
      config.historyDays,
      config.type === 'shop' ? { min: 3, max: 8 } : { min: 8, max: 20 }
    );
    orders = [...orders, ...historicalOrders];
  }
  
  return {
    ...baseData,
    orders
  };
}