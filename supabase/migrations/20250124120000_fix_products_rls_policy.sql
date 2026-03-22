-- Fix RLS policy for products to allow Admin and Inventory users, and include WITH CHECK clause
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin and Inventory can manage products" ON public.products
FOR ALL 
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super admin', 'admin', 'inventory'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super admin', 'admin', 'inventory'))
);

