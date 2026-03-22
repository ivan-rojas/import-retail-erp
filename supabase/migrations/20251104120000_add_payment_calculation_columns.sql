-- Add payment calculation columns to payments table
ALTER TABLE public.payments 
ADD COLUMN surcharge_percentage DECIMAL(10,2),
ADD COLUMN converted_amount DECIMAL(10,2),
ADD COLUMN amount_tendered DECIMAL(10,2),
ADD COLUMN change_amount DECIMAL(10,2),
ADD COLUMN base_amount DECIMAL(10,2);

ALTER TABLE public.sales 
ADD COLUMN customer_alias_cbu TEXT,
ADD COLUMN subtotal_price DECIMAL(10,2);

UPDATE public.payments 
SET base_amount = amount WHERE base_amount IS NULL;

UPDATE public.sales 
SET subtotal_price = sale_price WHERE subtotal_price IS NULL;