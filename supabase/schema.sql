CREATE TYPE user_role AS ENUM ('super admin', 'admin', 'seller', 'inventory', 'viewer');
CREATE TYPE status AS ENUM ('active', 'inactive', 'deleted');
CREATE TYPE item_type AS ENUM ('product', 'accessory');
CREATE TYPE item_status AS ENUM ('available', 'sold', 'reserved', 'deleted', 'in-repair', 'lost', 'spare');
CREATE TYPE sale_status AS ENUM ('sold', 'reserved', 'cancelled', 'deleted');
CREATE TYPE item_condition AS ENUM ('new', 'used', 'refurbished');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE currency AS ENUM ('USD', 'ARS');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'crypto');
CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'cancelled');
CREATE TYPE sale_line_type AS ENUM ('device', 'accessory', 'service');
CREATE TYPE audit_action AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
  'PASSWORD_RESET', 'ROLE_CHANGE', 'STATUS_CHANGE',
  'SALE_COMPLETE', 'RESERVATION_CREATE', 'RESERVATION_CANCEL',
  'PAYMENT_CREATE', 'PAYMENT_UPDATE', 'DELIVERY_UPDATE',
  'INVENTORY_ADJUST', 'BATCH_CREATE', 'TRADE_IN_PROCESS'
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'viewer' NOT NULL,
    must_reset_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type item_type NOT NULL,
    category TEXT NOT NULL,
    model TEXT NOT NULL,
    available_colors TEXT[] NOT NULL DEFAULT '{}',
    available_storage TEXT[] DEFAULT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    release_date DATE,
    "order" INTEGER,
    description TEXT NOT NULL,
    specifications JSONB DEFAULT '{}' NOT NULL,
    status status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Product categories table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

INSERT INTO public.product_categories (name, icon)
VALUES
  ('iphone', 'smartphone'),
  ('audio', 'headphones'),
  ('cable', 'cable'),
  ('carga', 'battery'),
  ('proteccion', 'shield')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

UPDATE public.products p
SET category_id = pc.id
FROM public.product_categories pc
WHERE p.category_id IS NULL
  AND lower(trim(p.category)) = lower(pc.name);

CREATE OR REPLACE FUNCTION public.sync_product_category_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO NEW.category
    FROM public.product_categories
    WHERE id = NEW.category_id;
  ELSIF NEW.category IS NOT NULL AND trim(NEW.category) <> '' THEN
    SELECT id INTO NEW.category_id
    FROM public.product_categories
    WHERE lower(name) = lower(trim(NEW.category))
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Batchs table
CREATE TABLE IF NOT EXISTS public.batchs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    status status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Items table
CREATE TABLE IF NOT EXISTS public.product_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    batch_id UUID REFERENCES public.batchs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    condition item_condition DEFAULT 'new' NOT NULL,
    color TEXT NOT NULL,
    storage TEXT,
    imei TEXT UNIQUE NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    notes TEXT,
    is_on_sale BOOLEAN NOT NULL DEFAULT false,
    status item_status DEFAULT 'available' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.accessory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    batch_id UUID REFERENCES public.batchs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    notes TEXT,
    is_on_sale BOOLEAN NOT NULL DEFAULT false,
    status item_status DEFAULT 'available' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Used items table
CREATE TABLE IF NOT EXISTS public.used_product_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.product_items(id) ON DELETE CASCADE NOT NULL,
    battery_health INTEGER DEFAULT 100 NOT NULL,
    issues TEXT[] DEFAULT '{}' NOT NULL,
    fixes TEXT[] DEFAULT '{}' NOT NULL,
    technician_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Technicians table
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'used_product_items_technician_id_fkey'
      AND table_name = 'used_product_items'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.used_product_items
      ADD CONSTRAINT used_product_items_technician_id_fkey
      FOREIGN KEY (technician_id) REFERENCES public.technicians(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Clients table (reusable customer records; sales can link via client_id)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_ig TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_alias_cbu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_ig TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_alias_cbu TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    status sale_status NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    subtotal_price DECIMAL(10,2),
    sale_date DATE NOT NULL,
    notes TEXT,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deposit DECIMAL(10,2) NOT NULL,
    status reservation_status NOT NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- item sales reservations table
CREATE TABLE IF NOT EXISTS public.sale_reservation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_name TEXT NOT NULL,
    item_model TEXT NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    item_quantity INTEGER NOT NULL,
    item_notes TEXT,
    product_item_id UUID REFERENCES public.product_items(id) ON DELETE CASCADE,
    accessory_item_id UUID REFERENCES public.accessory_items(id) ON DELETE CASCADE,
    sale_line_type sale_line_type NOT NULL DEFAULT 'device',
    item_cost DECIMAL(10,2),
    linked_product_item_id UUID REFERENCES public.product_items(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id),
    CONSTRAINT chk_service_line CHECK (
        (sale_line_type != 'service') OR (
            product_item_id IS NULL
            AND accessory_item_id IS NULL
            AND item_cost IS NOT NULL
        )
    )
);

-- Trade-ins table
CREATE TABLE IF NOT EXISTS public.trade_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.product_items(id) ON DELETE CASCADE NOT NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    base_amount DECIMAL(10,2),
    surcharge_percentage DECIMAL(10,2),
    converted_amount DECIMAL(10,2),
    amount_tendered DECIMAL(10,2),
    change_amount DECIMAL(10,2),
    payment_method payment_method NOT NULL,
    currency currency NOT NULL,
    usd_exchange_rate DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_notes TEXT,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Delivery table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    delivery_date TIMESTAMP NOT NULL,
    delivery_notes TEXT,
    delivery_status delivery_status NOT NULL,
    delivery_user_id UUID REFERENCES public.profiles(id) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core audit information
    action audit_action NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    
    -- User information
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT, -- Denormalized for easier querying
    user_role user_role, -- Denormalized for easier querying
    
    -- Change tracking
    old_values JSONB, -- Previous values (for UPDATE/DELETE)
    new_values JSONB, -- New values (for CREATE/UPDATE)
    changed_fields TEXT[], -- Array of field names that changed
    
    -- Context information
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Business context
    business_context JSONB, -- Additional context like sale_id, batch_id, etc.
    notes TEXT, -- Human-readable description
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Indexes for performance
    CONSTRAINT audit_logs_table_record_check CHECK (
        (table_name IS NOT NULL) OR
        (table_name IS NULL AND record_id IS NULL)
    )
);

-- Configuration table (app settings, e.g. personalization colors)
CREATE TABLE IF NOT EXISTS public.configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL DEFAULT '',
    description TEXT,
    status status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed: personalization color keys (values stored as JSON e.g. {"light":"#hex","dark":"#hex"})
INSERT INTO public.configuration (config_key, config_value, description, status)
VALUES
  ('General.Customization.Color.Main', '{}', 'Color principal por tema (light/dark). JSON: {"light":"#hex","dark":"#hex"}', 'active'),
  ('General.Customization.Color.Secondary', '{}', 'Color de fondo por tema (light/dark). JSON: {"light":"#hex","dark":"#hex"}', 'active'),
  ('General.Customization.Client.Name', 'TL iPhones', 'Nombre del cliente/app (branding).', 'active'),
  ('General.Customization.Client.Logo', 'client-assets/logo.webp', 'Logo del cliente/app. Path en Storage (bucket público).', 'active'),
  ('General.Customization.Client.Subtitle', 'Sistema de Inventario', 'Subtítulo del cliente/app (branding).', 'active')
ON CONFLICT (config_key) DO NOTHING;

-- Indexes
-- Products
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_release_date ON public.products(release_date);
CREATE INDEX IF NOT EXISTS idx_products_release_date_order ON public.products(release_date, "order");
CREATE INDEX IF NOT EXISTS idx_products_wholesale_price ON public.products(wholesale_price);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON public.product_categories(name);
-- Items
CREATE INDEX IF NOT EXISTS idx_items_product_id ON public.product_items(product_id);
CREATE INDEX IF NOT EXISTS idx_items_batch_id ON public.product_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.product_items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_by ON public.product_items(created_by);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.product_items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_created_by ON public.product_items(created_by);
CREATE INDEX IF NOT EXISTS idx_items_updated_by ON public.product_items(updated_by);
CREATE INDEX IF NOT EXISTS idx_product_items_wholesale_price ON public.product_items(wholesale_price);

-- Used items
CREATE INDEX IF NOT EXISTS idx_used_items_item_id ON public.used_product_items(item_id);
CREATE INDEX IF NOT EXISTS idx_used_items_created_at ON public.used_product_items(created_at);
CREATE INDEX IF NOT EXISTS idx_used_items_technician_id ON public.used_product_items(technician_id);

-- Technicians
CREATE INDEX IF NOT EXISTS idx_technicians_name ON public.technicians(name);
CREATE INDEX IF NOT EXISTS idx_technicians_created_at ON public.technicians(created_at);

-- Reservations
CREATE INDEX IF NOT EXISTS idx_reservations_sale_id ON public.reservations(sale_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at);

-- Trade-ins
CREATE INDEX IF NOT EXISTS idx_trade_ins_item_id ON public.trade_ins(item_id);
CREATE INDEX IF NOT EXISTS idx_trade_ins_sale_id ON public.trade_ins(sale_id);
CREATE INDEX IF NOT EXISTS idx_trade_ins_created_at ON public.trade_ins(created_at);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_currency ON public.payments(currency);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Accessory sales
CREATE INDEX IF NOT EXISTS idx_accessory_sales_created_at ON public.accessory_items(created_at);

-- Sale reservation items
CREATE INDEX IF NOT EXISTS idx_sale_reservation_items_sale_id ON public.sale_reservation_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_reservation_items_accessory_item_id ON public.sale_reservation_items(accessory_item_id);
CREATE INDEX IF NOT EXISTS idx_sale_reservation_items_product_item_id ON public.sale_reservation_items(product_item_id);
CREATE INDEX IF NOT EXISTS idx_sale_reservation_items_reservation_id ON public.sale_reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_sale_reservation_items_created_at ON public.sale_reservation_items(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON public.audit_logs(user_role);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_action ON public.audit_logs(created_at, action);

-- Configuration
CREATE INDEX IF NOT EXISTS idx_configuration_config_key ON public.configuration(config_key);
CREATE INDEX IF NOT EXISTS idx_configuration_status ON public.configuration(status);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.updated_by IS NULL THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
-- Profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Products
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE OR REPLACE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_created_by ON public.products;
CREATE OR REPLACE TRIGGER set_products_created_by
    BEFORE INSERT ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_products_updated_by ON public.products;
CREATE OR REPLACE TRIGGER set_products_updated_by
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

DROP TRIGGER IF EXISTS sync_products_category_fields ON public.products;
CREATE TRIGGER sync_products_category_fields
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.sync_product_category_fields();

-- Product categories
DROP TRIGGER IF EXISTS set_product_categories_updated_at ON public.product_categories;
CREATE OR REPLACE TRIGGER set_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_product_categories_created_by ON public.product_categories;
CREATE OR REPLACE TRIGGER set_product_categories_created_by
    BEFORE INSERT ON public.product_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_product_categories_updated_by ON public.product_categories;
CREATE OR REPLACE TRIGGER set_product_categories_updated_by
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Items
DROP TRIGGER IF EXISTS set_items_created_by ON public.product_items;
CREATE OR REPLACE TRIGGER set_items_created_by
    BEFORE INSERT ON public.product_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_items_updated_by ON public.product_items;
CREATE OR REPLACE TRIGGER set_items_updated_by
    BEFORE UPDATE ON public.product_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

DROP TRIGGER IF EXISTS set_items_updated_at ON public.product_items;
CREATE TRIGGER set_items_updated_at
    BEFORE UPDATE ON public.product_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Clients
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_clients_created_by ON public.clients;
CREATE OR REPLACE TRIGGER set_clients_created_by
    BEFORE INSERT ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_clients_updated_by ON public.clients;
CREATE OR REPLACE TRIGGER set_clients_updated_by
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Technicians
DROP TRIGGER IF EXISTS set_technicians_updated_at ON public.technicians;
CREATE TRIGGER set_technicians_updated_at
    BEFORE UPDATE ON public.technicians
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_technicians_created_by ON public.technicians;
CREATE OR REPLACE TRIGGER set_technicians_created_by
    BEFORE INSERT ON public.technicians
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_technicians_updated_by ON public.technicians;
CREATE OR REPLACE TRIGGER set_technicians_updated_by
    BEFORE UPDATE ON public.technicians
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Configuration
DROP TRIGGER IF EXISTS set_configuration_updated_at ON public.configuration;
CREATE TRIGGER set_configuration_updated_at
    BEFORE UPDATE ON public.configuration
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Sales
DROP TRIGGER IF EXISTS set_sales_updated_at ON public.sales;
CREATE TRIGGER set_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_sales_created_by ON public.sales;
CREATE OR REPLACE TRIGGER set_sales_created_by
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_sales_updated_by ON public.sales;
CREATE OR REPLACE TRIGGER set_sales_updated_by
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Batchs
DROP TRIGGER IF EXISTS set_batchs_updated_at ON public.batchs;
CREATE TRIGGER set_batchs_updated_at
    BEFORE UPDATE ON public.batchs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_batchs_created_by ON public.batchs;
CREATE OR REPLACE TRIGGER set_batchs_created_by
    BEFORE INSERT ON public.batchs
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_batchs_updated_by ON public.batchs;
CREATE OR REPLACE TRIGGER set_batchs_updated_by
    BEFORE UPDATE ON public.batchs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Used items
DROP TRIGGER IF EXISTS set_used_items_updated_at ON public.used_product_items;
CREATE TRIGGER set_used_items_updated_at
    BEFORE UPDATE ON public.used_product_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_used_items_created_by ON public.used_product_items;
CREATE OR REPLACE TRIGGER set_used_items_created_by
    BEFORE INSERT ON public.used_product_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_used_items_updated_by ON public.used_product_items;
CREATE OR REPLACE TRIGGER set_used_items_updated_by
    BEFORE UPDATE ON public.used_product_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Reservations
DROP TRIGGER IF EXISTS set_reservations_updated_at ON public.reservations;
CREATE TRIGGER set_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_reservations_created_by ON public.reservations;
CREATE OR REPLACE TRIGGER set_reservations_created_by
    BEFORE INSERT ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_reservations_updated_by ON public.reservations;
CREATE OR REPLACE TRIGGER set_reservations_updated_by
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Trade-ins
DROP TRIGGER IF EXISTS set_trade_ins_updated_at ON public.trade_ins;
CREATE TRIGGER set_trade_ins_updated_at
    BEFORE UPDATE ON public.trade_ins
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_trade_ins_created_by ON public.trade_ins;
CREATE OR REPLACE TRIGGER set_trade_ins_created_by
    BEFORE INSERT ON public.trade_ins
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_trade_ins_updated_by ON public.trade_ins;
CREATE OR REPLACE TRIGGER set_trade_ins_updated_by
    BEFORE UPDATE ON public.trade_ins
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Payments
DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_payments_created_by ON public.payments;
CREATE OR REPLACE TRIGGER set_payments_created_by
    BEFORE INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_payments_updated_by ON public.payments;
CREATE OR REPLACE TRIGGER set_payments_updated_by
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Accessory sales
DROP TRIGGER IF EXISTS set_accessory_sales_updated_at ON public.accessory_items;
CREATE TRIGGER set_accessory_sales_updated_at
    BEFORE UPDATE ON public.accessory_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_accessory_sales_created_by ON public.accessory_items;
CREATE OR REPLACE TRIGGER set_accessory_sales_created_by
    BEFORE INSERT ON public.accessory_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_accessory_sales_updated_by ON public.accessory_items;
CREATE OR REPLACE TRIGGER set_accessory_sales_updated_by
    BEFORE UPDATE ON public.accessory_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Role check functions 
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = user_id
      AND p.role IN ('admin', 'super admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_seller_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = user_id
      AND p.role IN ('admin', 'super admin', 'seller')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_inventory_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = user_id
      AND p.role IN ('admin', 'super admin', 'inventory')
  );
$$;

-- When a new user is created in Supabase Auth (e.g. from Dashboard or admin API),
-- automatically create the corresponding profile row so they can log in.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, must_reset_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'viewer'),
    COALESCE((NEW.raw_user_meta_data->>'must_reset_password')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.batchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_product_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies

-- Profiles policies
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can edit their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can edit their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can edit all profiles" ON public.profiles;
CREATE POLICY "Admins can edit all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Products policies
DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
CREATE POLICY "Everyone can view active products" ON public.products
    FOR SELECT USING (
        status = 'active' OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super admin', 'admin', 'seller', 'inventory', 'viewer'))
    );

DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
DROP POLICY IF EXISTS "Admin and Inventory can manage products" ON public.products;
CREATE POLICY "Admin and Inventory can manage products" ON public.products
FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super admin', 'admin', 'inventory'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super admin', 'admin', 'inventory'))
);

DROP POLICY IF EXISTS "Admin and Inventory can manage product_categories" ON public.product_categories;
CREATE POLICY "Admin and Inventory can manage product_categories" ON public.product_categories
FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super admin', 'admin', 'inventory'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super admin', 'admin', 'inventory'))
);

-- General policies: allow all operations for any authenticated user on remaining tables

-- Batchs policies
DROP POLICY IF EXISTS "Authenticated users can do all on batchs" ON public.batchs;
CREATE POLICY "Authenticated users can do all on batchs"
ON public.batchs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Product items policies
DROP POLICY IF EXISTS "Authenticated users can do all on product_items" ON public.product_items;
CREATE POLICY "Authenticated users can do all on product_items"
ON public.product_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Accessory items policies
DROP POLICY IF EXISTS "Authenticated users can do all on accessory_items" ON public.accessory_items;
CREATE POLICY "Authenticated users can do all on accessory_items"
ON public.accessory_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Used product items policies
DROP POLICY IF EXISTS "Authenticated users can do all on used_product_items" ON public.used_product_items;
CREATE POLICY "Authenticated users can do all on used_product_items"
ON public.used_product_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Reservations policies
DROP POLICY IF EXISTS "Authenticated users can do all on reservations" ON public.reservations;
CREATE POLICY "Authenticated users can do all on reservations"
ON public.reservations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trade-ins policies
DROP POLICY IF EXISTS "Authenticated users can do all on trade_ins" ON public.trade_ins;
CREATE POLICY "Authenticated users can do all on trade_ins"
ON public.trade_ins
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Sales policies
-- Clients policies
DROP POLICY IF EXISTS "Authenticated users can do all on clients" ON public.clients;
CREATE POLICY "Authenticated users can do all on clients"
ON public.clients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Technicians policies
DROP POLICY IF EXISTS "Authenticated users can do all on technicians" ON public.technicians;
CREATE POLICY "Authenticated users can do all on technicians"
ON public.technicians
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Configuration policies (read/update for authenticated)
DROP POLICY IF EXISTS "Authenticated users can read configuration" ON public.configuration;
CREATE POLICY "Authenticated users can read configuration"
ON public.configuration FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update configuration" ON public.configuration;
CREATE POLICY "Authenticated users can update configuration"
ON public.configuration FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Sales policies
DROP POLICY IF EXISTS "Authenticated users can do all on sales" ON public.sales;
CREATE POLICY "Authenticated users can do all on sales"
ON public.sales
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Payments policies
DROP POLICY IF EXISTS "Authenticated users can do all on payments" ON public.payments;
CREATE POLICY "Authenticated users can do all on payments"
ON public.payments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Deliveries policies
DROP POLICY IF EXISTS "Authenticated users can do all on deliveries" ON public.deliveries;
CREATE POLICY "Authenticated users can do all on deliveries"
ON public.deliveries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Sale reservation items policies
DROP POLICY IF EXISTS "Authenticated users can do all on sale_reservation_items" ON public.sale_reservation_items;
CREATE POLICY "Authenticated users can do all on sale_reservation_items"
ON public.sale_reservation_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Audit logs policies
-- Admins can view all audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system can insert audit logs (via service role)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- No updates or deletes allowed on audit logs
DROP POLICY IF EXISTS "No updates on audit logs" ON public.audit_logs;
CREATE POLICY "No updates on audit logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "No deletes on audit logs" ON public.audit_logs;
CREATE POLICY "No deletes on audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (false);
