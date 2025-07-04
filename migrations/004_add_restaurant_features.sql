-- Restaurant Tables
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  section TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  x_position INTEGER,
  y_position INTEGER,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  party_size INTEGER NOT NULL,
  reservation_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kitchen Tickets
CREATE TABLE IF NOT EXISTS kitchen_tickets (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  estimated_completion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Staff Roles
CREATE TABLE IF NOT EXISTS staff_roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  permissions TEXT NOT NULL,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE
);

-- Add restaurant fields to existing orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS server_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'dine_in';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS course_timing TEXT;

-- Add restaurant fields to existing order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS course_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;

-- Add restaurant fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES staff_roles(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_shop_id ON tables(shop_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_reservations_shop_id ON reservations(shop_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_time ON reservations(reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_order_id ON kitchen_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_staff_roles_shop_id ON staff_roles(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_server_id ON orders(server_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_course_number ON order_items(course_number);

-- Insert default staff roles for existing shops
INSERT INTO staff_roles (name, permissions, shop_id)
SELECT 'manager', '["all"]', id FROM shops
ON CONFLICT DO NOTHING;

INSERT INTO staff_roles (name, permissions, shop_id)
SELECT 'server', '["take_orders", "view_orders", "process_payments"]', id FROM shops
ON CONFLICT DO NOTHING;

INSERT INTO staff_roles (name, permissions, shop_id)
SELECT 'host', '["manage_tables", "manage_reservations", "seat_guests"]', id FROM shops
ON CONFLICT DO NOTHING;

INSERT INTO staff_roles (name, permissions, shop_id)
SELECT 'kitchen', '["view_kitchen_tickets", "update_order_status"]', id FROM shops
ON CONFLICT DO NOTHING;

-- Assign manager role to existing admin users
UPDATE users 
SET role_id = (
  SELECT sr.id 
  FROM staff_roles sr 
  JOIN user_shops us ON sr.shop_id = us.shop_id 
  WHERE sr.name = 'manager' 
  AND us.user_id = users.id 
  LIMIT 1
)
WHERE is_admin = true AND role_id IS NULL;