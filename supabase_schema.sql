-- ==============================================================================
-- WELILE PARK - Complete Supabase / PostgreSQL Database Schema
-- Fixed Schema: Uses TEXT Primary Keys & Foreign Keys to match custom App IDs
-- (e.g., 'usr-1785156287249', 'veh-1785156335396', 'srv-101', 'res-202')
-- ==============================================================================

-- 1. DROP EXISTING TABLES IF RE-RUNNING (To safely clean up previous UUID types)
DROP TABLE IF EXISTS public.service_items CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.vehicle_services CASCADE;
DROP TABLE IF EXISTS public.parking_reservations CASCADE;
DROP TABLE IF EXISTS public.parking_spaces CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Customer' CHECK (role IN ('Customer', 'Parking Attendant', 'Service Technician', 'Service Manager', 'Administrator')),
  is_authorized_staff BOOLEAN DEFAULT FALSE,
  authorization_status TEXT DEFAULT 'Customer' CHECK (authorization_status IN ('Authorized', 'Pending Approval', 'Customer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  registration_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  color TEXT NOT NULL,
  mileage INT DEFAULT 0,
  vin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PARKING SPACES TABLE
CREATE TABLE IF NOT EXISTS public.parking_spaces (
  id TEXT PRIMARY KEY,
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  section TEXT NOT NULL,
  space_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Occupied')),
  price_per_hour NUMERIC NOT NULL DEFAULT 5000, -- UGX
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PARKING RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.parking_reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  parking_space_id TEXT NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
  amount NUMERIC NOT NULL DEFAULT 5000,
  qr_code TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VEHICLE SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.vehicle_services (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  technician_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Booked' CHECK (status IN ('Booked', 'Vehicle Inspection', 'Oil Change', 'Brake Inspection', 'Wheel Alignment', 'Car Wash', 'Mobile Van Dispatched', 'Completed', 'Ready for Pickup')),
  cost NUMERIC NOT NULL DEFAULT 0,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  diagnostic_notes TEXT,
  
  -- Home Servicing Details
  is_home_service BOOLEAN DEFAULT FALSE,
  home_address TEXT,
  home_city TEXT,
  home_landmark TEXT,
  contact_phone TEXT,

  -- Technician Assignment & Handoff Tracking
  assignment_status TEXT DEFAULT 'Pending' CHECK (assignment_status IN ('Pending', 'Accepted', 'Rejected')),
  rejection_reason TEXT,
  assigned_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  manager_notified_of_completion BOOLEAN DEFAULT FALSE,
  completion_notification_sent_at TIMESTAMPTZ,
  customer_notified_by_manager BOOLEAN DEFAULT FALSE,
  customer_notification_sent_at TIMESTAMPTZ,
  assigned_delivery_bay TEXT,
  attendant_handoff_status TEXT DEFAULT 'Pending Attendant Verification' CHECK (attendant_handoff_status IN ('Pending Attendant Verification', 'Attendant Verified in Bay', 'Customer Handed Over')),
  completion_hand_off_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SERVICE ITEMS TABLE (Extra Inventory Parts & Services on Invoice)
CREATE TABLE IF NOT EXISTS public.service_items (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES public.vehicle_services(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Mobile Money', 'Credit Card', 'Bank Transfer', 'Digital Wallet')),
  transaction_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed')),
  date TIMESTAMPTZ DEFAULT NOW(),
  reservation_id TEXT REFERENCES public.parking_reservations(id) ON DELETE SET NULL,
  service_id TEXT REFERENCES public.vehicle_services(id) ON DELETE SET NULL,
  payment_details TEXT
);

-- 9. INVENTORY ITEMS TABLE (Workshop Spare Parts & Lubricants)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  part_name TEXT UNIQUE NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  min_required INT NOT NULL DEFAULT 5,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR OPTIMIZED QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.parking_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.parking_reservations(status);
CREATE INDEX IF NOT EXISTS idx_services_customer_id ON public.vehicle_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_technician_id ON public.vehicle_services(technician_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.vehicle_services(status);
CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON public.service_items(service_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS for safe multi-role client and server data access
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read and write access
CREATE POLICY "Allow full access for authenticated and anon users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow full access for vehicles" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Allow full access for parking_spaces" ON public.parking_spaces FOR ALL USING (true);
CREATE POLICY "Allow full access for parking_reservations" ON public.parking_reservations FOR ALL USING (true);
CREATE POLICY "Allow full access for vehicle_services" ON public.vehicle_services FOR ALL USING (true);
CREATE POLICY "Allow full access for service_items" ON public.service_items FOR ALL USING (true);
CREATE POLICY "Allow full access for payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Allow full access for inventory_items" ON public.inventory_items FOR ALL USING (true);

-- ==============================================================================
-- INITIAL SEED DATA (UGANDA / WELILE PARK DEFAULT RECORDS)
-- ==============================================================================

-- Seed Workshop Inventory
INSERT INTO public.inventory_items (id, part_name, quantity, min_required, price) VALUES
  ('inv-1', 'Synthetic Engine Oil (5L)', 25, 5, 120000),
  ('inv-2', 'Heavy Duty Brake Pads (Pair)', 14, 4, 85000),
  ('inv-3', 'Engine Air Filter', 30, 8, 45000),
  ('inv-4', 'Oil Filter Element', 40, 10, 35000),
  ('inv-5', 'Premium All-Season Tyre 205/55R16', 12, 4, 320000),
  ('inv-6', 'Car Battery 12V 65Ah', 8, 2, 280000),
  ('inv-7', 'Iridium Spark Plugs (Set of 4)', 18, 5, 95000),
  ('inv-8', 'AC Refrigerant Gas R134a (Can)', 15, 3, 65000),
  ('inv-9', 'High Gloss Car Wax & Polish', 20, 5, 40000)
ON CONFLICT (id) DO NOTHING;

-- Seed Parking Spaces
INSERT INTO public.parking_spaces (id, location, floor, section, space_number, status, price_per_hour) VALUES
  ('spc-1', 'Main Garage', 'Ground', 'A', 'A01', 'Available', 5000),
  ('spc-2', 'Main Garage', 'Ground', 'A', 'A02', 'Available', 5000),
  ('spc-3', 'Main Garage', 'Ground', 'A', 'A12', 'Available', 5000),
  ('spc-4', 'Main Garage', 'Floor 1', 'B', 'B05', 'Available', 5000),
  ('spc-5', 'Main Garage', 'Floor 1', 'B', 'B10', 'Available', 5000),
  ('spc-6', 'Executive Yard', 'Floor 2', 'VIP', 'V01', 'Available', 10000)
ON CONFLICT (id) DO NOTHING;
