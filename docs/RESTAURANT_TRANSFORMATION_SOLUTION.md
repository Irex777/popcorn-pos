# Restaurant-First POS Transformation Solution

## Executive Summary

This document outlines the comprehensive transformation of the current Popcorn POS system into a restaurant-first point-of-sale solution. The transformation will implement a clear customer workflow: **Seated → Ordered → Served → Paid → Repeat**, inspired by Square's restaurant POS system while maintaining the existing design aesthetic.

## Current State Analysis

### Existing Architecture
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query
- **Backend**: Node.js with Express, PostgreSQL with Drizzle ORM
- **Current Pages**: POS, History, Inventory, Settings, Categories, Analytics, Auth
- **Current Workflow**: Simple retail-style product selection and checkout

### Current Database Schema
- Users, Shops, Categories, Products, Orders, OrderItems
- Basic multi-shop support
- Simple order tracking with status field

## Target Restaurant Workflow

### 1. Customer Journey
```
Guest Arrival → Table Assignment → Order Taking → Kitchen Preparation → Service → Payment → Table Turnover
```

### 2. Staff Workflow
```
Host/Hostess → Server → Kitchen Staff → Server → Cashier/Server
```

## Proposed Solution Architecture

### Phase 1: Core Restaurant Infrastructure

#### 1.1 Database Schema Extensions

**New Tables:**
```sql
-- Table management
tables (
  id: serial PRIMARY KEY,
  number: text NOT NULL,
  capacity: integer NOT NULL,
  section: text,
  status: text NOT NULL, -- 'available', 'occupied', 'reserved', 'cleaning'
  x_position: integer,
  y_position: integer,
  shop_id: integer REFERENCES shops(id)
)

-- Reservations
reservations (
  id: serial PRIMARY KEY,
  customer_name: text NOT NULL,
  customer_phone: text,
  party_size: integer NOT NULL,
  reservation_time: timestamp NOT NULL,
  status: text NOT NULL, -- 'confirmed', 'seated', 'cancelled', 'no_show'
  table_id: integer REFERENCES tables(id),
  shop_id: integer REFERENCES shops(id),
  created_at: timestamp DEFAULT NOW()
)

-- Enhanced orders for restaurant workflow
ALTER TABLE orders ADD COLUMN table_id integer REFERENCES tables(id);
ALTER TABLE orders ADD COLUMN server_id integer REFERENCES users(id);
ALTER TABLE orders ADD COLUMN order_type text DEFAULT 'dine_in'; -- 'dine_in', 'takeout', 'delivery'
ALTER TABLE orders ADD COLUMN guest_count integer DEFAULT 1;
ALTER TABLE orders ADD COLUMN special_instructions text;
ALTER TABLE orders ADD COLUMN course_timing text; -- JSON for course timing

-- Order items with kitchen workflow
ALTER TABLE order_items ADD COLUMN status text DEFAULT 'pending'; -- 'pending', 'preparing', 'ready', 'served'
ALTER TABLE order_items ADD COLUMN course_number integer DEFAULT 1;
ALTER TABLE order_items ADD COLUMN special_requests text;
ALTER TABLE order_items ADD COLUMN preparation_time integer; -- estimated minutes

-- Kitchen display system
kitchen_tickets (
  id: serial PRIMARY KEY,
  order_id: integer REFERENCES orders(id) NOT NULL,
  ticket_number: text NOT NULL,
  status: text NOT NULL, -- 'new', 'preparing', 'ready', 'served'
  priority: text DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  estimated_completion: timestamp,
  created_at: timestamp DEFAULT NOW(),
  completed_at: timestamp
)

-- Staff roles and permissions
staff_roles (
  id: serial PRIMARY KEY,
  name: text NOT NULL, -- 'host', 'server', 'kitchen', 'manager', 'cashier'
  permissions: text NOT NULL, -- JSON array of permissions
  shop_id: integer REFERENCES shops(id)
)

ALTER TABLE users ADD COLUMN role_id integer REFERENCES staff_roles(id);
ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
```

#### 1.2 New API Endpoints

**Table Management:**
- `GET /api/tables` - Get all tables for shop
- `POST /api/tables` - Create new table
- `PUT /api/tables/:id` - Update table status/position
- `DELETE /api/tables/:id` - Remove table

**Reservation System:**
- `GET /api/reservations` - Get reservations for date range
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation

**Restaurant Orders:**
- `POST /api/orders/dine-in` - Create dine-in order with table
- `PUT /api/orders/:id/course` - Update course timing
- `PUT /api/orders/:id/items/:itemId/status` - Update item status
- `GET /api/orders/active` - Get all active orders for kitchen

**Kitchen Display:**
- `GET /api/kitchen/tickets` - Get active kitchen tickets
- `PUT /api/kitchen/tickets/:id/status` - Update ticket status
- `POST /api/kitchen/tickets/:id/ready` - Mark items as ready

### Phase 2: Frontend Restaurant Components

#### 2.1 New Page Structure
```
/host          - Table management and reservations
/server        - Server interface for taking orders
/kitchen       - Kitchen display system
/pos           - Enhanced for restaurant workflow
/floor-plan    - Visual table layout management
```

#### 2.2 Core Components

**Host Station (`/host`):**
- Floor plan view with table status
- Reservation management
- Wait list functionality
- Table assignment interface

**Server Interface (`/server`):**
- Table-based order management
- Menu with modifiers and special requests
- Course timing controls
- Split check functionality
- Payment processing

**Kitchen Display (`/kitchen`):**
- Real-time order tickets
- Item status tracking
- Timer management
- Priority indicators

**Enhanced POS (`/pos`):**
- Quick service mode toggle
- Table selection for dine-in
- Order type selection (dine-in/takeout/delivery)
- Guest count input

#### 2.3 Component Architecture

```typescript
// Table Management
components/
  restaurant/
    host/
      FloorPlan.tsx
      TableCard.tsx
      ReservationList.tsx
      WaitList.tsx
    server/
      TableOrders.tsx
      MenuWithModifiers.tsx
      CourseManager.tsx
      SplitCheck.tsx
    kitchen/
      KitchenTicket.tsx
      TicketQueue.tsx
      TimerDisplay.tsx
    shared/
      TableSelector.tsx
      OrderStatusBadge.tsx
      GuestCounter.tsx
```

### Phase 3: Workflow Implementation

#### 3.1 Customer Seating Workflow
1. **Host assigns table** → Updates table status to 'occupied'
2. **Server approaches table** → Selects table in server interface
3. **Order taking begins** → Creates new order linked to table
4. **Order sent to kitchen** → Generates kitchen ticket

#### 3.2 Kitchen Workflow
1. **Order received** → Appears on kitchen display
2. **Preparation begins** → Items marked as 'preparing'
3. **Items completed** → Marked as 'ready', server notified
4. **Items served** → Marked as 'served' by server

#### 3.3 Payment & Turnover
1. **Check requested** → Server processes payment at table
2. **Payment completed** → Order marked as 'paid'
3. **Table cleared** → Table status reset to 'available'

### Phase 4: Advanced Restaurant Features

#### 4.1 Course Management
- Appetizer, main course, dessert timing
- Kitchen coordination for simultaneous delivery
- Special dietary requirements tracking

#### 4.2 Split Check System
- Split by item
- Split by guest
- Split evenly
- Custom split amounts

#### 4.3 Table Management
- Visual floor plan editor
- Table combination for large parties
- Section assignment for servers
- Table turn time tracking

#### 4.4 Staff Management
- Role-based permissions
- Server assignment to sections
- Performance tracking
- Tip distribution

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Database schema updates
- Basic table management
- Enhanced order model
- Core API endpoints

### Phase 2: Host Station (Weeks 3-4)
- Floor plan component
- Table status management
- Basic reservation system
- Table assignment workflow

### Phase 3: Server Interface (Weeks 5-6)
- Table-based ordering
- Menu with modifiers
- Order status tracking
- Basic payment processing

### Phase 4: Kitchen Display (Weeks 7-8)
- Kitchen ticket system
- Real-time order updates
- Status management
- Timer functionality

### Phase 5: Advanced Features (Weeks 9-12)
- Course management
- Split check system
- Advanced reporting
- Staff management
- Performance optimization

## Technical Considerations

### 1. Real-time Updates
- WebSocket implementation for live order updates
- Kitchen display real-time synchronization
- Table status live updates

### 2. Mobile Responsiveness
- Server tablets for tableside ordering
- Kitchen display on various screen sizes
- Host station on tablets/phones

### 3. Offline Capability
- Local storage for order taking
- Sync when connection restored
- Critical workflow continuity

### 4. Performance
- Optimized queries for active orders
- Efficient table status updates
- Minimal re-renders for real-time data

## Migration Strategy

### 1. Backward Compatibility
- Maintain existing retail POS functionality
- Add restaurant mode toggle
- Gradual feature rollout

### 2. Data Migration
- Convert existing orders to new schema
- Preserve historical data
- Smooth transition for existing users

### 3. Training & Documentation
- User guides for each role
- Video tutorials
- In-app onboarding

## Success Metrics

### 1. Operational Efficiency
- Reduced order taking time
- Faster table turnover
- Improved kitchen coordination

### 2. User Adoption
- Staff training completion
- Feature utilization rates
- User satisfaction scores

### 3. Business Impact
- Increased revenue per table
- Reduced wait times
- Improved customer satisfaction

## Implementation Status

### ✅ Phase 1: Foundation (COMPLETED)
**Database Schema Extensions:**
- ✅ Added `tables` table with position, capacity, status, and section fields
- ✅ Added `reservations` table with customer info, party size, and timing
- ✅ Added `kitchen_tickets` table for order tracking and kitchen workflow
- ✅ Added `staff_roles` table for role-based permissions
- ✅ Extended `orders` table with restaurant fields (table_id, server_id, order_type, guest_count, special_instructions, course_timing)
- ✅ Extended `order_items` table with kitchen workflow fields (status, course_number, special_requests, preparation_time)
- ✅ Extended `users` table with restaurant fields (role_id, is_active)

**API Endpoints:**
- ✅ Tables CRUD operations (`/api/shops/:shopId/tables`)
- ✅ Reservations CRUD operations (`/api/shops/:shopId/reservations`)
- ✅ Kitchen tickets management (`/api/shops/:shopId/kitchen/tickets`)
- ✅ Staff roles management (`/api/shops/:shopId/staff-roles`)
- ✅ Enhanced dine-in order creation (`/api/shops/:shopId/orders/dine-in`)

**Database Migration:**
- ✅ Created migration file `004_add_restaurant_features.sql`
- ✅ Updated storage layer with restaurant methods
- ✅ Added proper indexes for performance

### ✅ Phase 2: Host Station (COMPLETED)
**Host Interface:**
- ✅ Created `/host` page with table management, reservations, and wait list
- ✅ Built `FloorPlanView` component with interactive table status
- ✅ Built `ReservationList` component with today's reservations
- ✅ Built `WaitList` component with customer queue management
- ✅ Added quick stats dashboard for host overview

**Floor Plan Management:**
- ✅ Created `/floor-plan` page for layout design
- ✅ Table type templates and section management
- ✅ Layout statistics and design tools

### ✅ Phase 3: Server Interface (COMPLETED)
**Server Station:**
- ✅ Created `/server` page with table-based order management
- ✅ Server performance dashboard with sales tracking
- ✅ Table status overview with order progression
- ✅ Integration points for menu and payment processing

**Enhanced POS:**
- ✅ Created `RestaurantCartPanel` with restaurant-specific workflow
- ✅ Built `TableSelector` component for dine-in orders
- ✅ Built `OrderTypeSelector` for dine-in/takeout/delivery
- ✅ Built `GuestCounter` for party size tracking
- ✅ Created `RestaurantCheckoutDialog` with special instructions and course management

### ✅ Phase 4: Kitchen Display (COMPLETED)
**Kitchen Interface:**
- ✅ Created `/kitchen` page with real-time order tickets
- ✅ Priority-based ticket display with color coding
- ✅ Item-level status tracking (pending → preparing → ready → served)
- ✅ Timer displays with overdue alerts
- ✅ Ticket completion workflow

**Shared Components:**
- ✅ `TableSelector` for table assignment
- ✅ `OrderTypeSelector` for order classification
- ✅ `GuestCounter` for party size management
- ✅ Status badges and priority indicators

### 🔄 Current Implementation Features

**Restaurant Workflow Support:**
- ✅ **Seated**: Host can assign tables and manage floor plan
- ✅ **Ordered**: Enhanced POS with table selection and order types
- ✅ **Served**: Kitchen display with item status tracking
- ✅ **Paid**: Integration with existing payment system
- ✅ **Repeat**: Table turnover and status management

**Navigation Updates:**
- ✅ Added Host, Server, and Kitchen to main navigation
- ✅ Maintained existing design consistency
- ✅ Role-based access ready for implementation

### 🚧 Next Steps (Future Enhancements)

**Advanced Features (Phase 5):**
- [ ] Course management and timing coordination
- [ ] Split check functionality
- [ ] Advanced reporting and analytics
- [ ] Staff performance tracking
- [ ] Real-time WebSocket updates for kitchen display
- [ ] Mobile server app for tableside ordering
- [ ] Integration with delivery platforms

**Database Optimizations:**
- [ ] Add database triggers for automatic kitchen ticket creation
- [ ] Implement soft deletes for audit trails
- [ ] Add table turn time tracking
- [ ] Performance monitoring and query optimization

## Conclusion

The restaurant-first transformation has been successfully implemented with all core phases completed. The system now supports the complete restaurant workflow: **Seated → Ordered → Served → Paid → Repeat**.

**Key Achievements:**
- ✅ Complete database schema for restaurant operations
- ✅ Full API layer for all restaurant features
- ✅ Host station for table and reservation management
- ✅ Server interface for order management
- ✅ Kitchen display system for order tracking
- ✅ Enhanced POS with restaurant-specific workflow
- ✅ Maintained existing design consistency

The solution successfully transforms Popcorn POS into a comprehensive restaurant management system while preserving its existing retail capabilities. The implementation follows Square's proven restaurant POS patterns and provides a solid foundation for future enhancements.