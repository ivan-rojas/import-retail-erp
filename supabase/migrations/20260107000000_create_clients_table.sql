-- Create clients table
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

-- Add client_id foreign key to sales table
ALTER TABLE public.sales 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for client_id in sales
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);

-- Create index for clients table
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);

-- Add triggers for clients table
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_clients_created_by ON public.clients;
CREATE TRIGGER set_clients_created_by
    BEFORE INSERT ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS set_clients_updated_by ON public.clients;
CREATE TRIGGER set_clients_updated_by
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_by();

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS policy for clients (all authenticated users can do all operations)
DROP POLICY IF EXISTS "Authenticated users can do all on clients" ON public.clients;
CREATE POLICY "Authenticated users can do all on clients"
ON public.clients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

