-- Add release_date and order columns to products table
-- release_date: The release date of the device
-- order: The order when release date is the same (from base model to pro max)

ALTER TABLE public.products 
ADD COLUMN release_date DATE,
ADD COLUMN "order" INTEGER,
ADD COLUMN wholesale_price DECIMAL(10,2);

ALTER TABLE public.product_items 
ADD COLUMN wholesale_price DECIMAL(10,2);

ALTER TABLE public.product_items 
DROP CONSTRAINT IF EXISTS product_items_imei_key;

ALTER TABLE public.accessory_items 
ADD COLUMN wholesale_price DECIMAL(10,2);

-- Add comments to document the columns
COMMENT ON COLUMN public.products.release_date IS 'The release date of the device';
COMMENT ON COLUMN public.products."order" IS 'The order when release date is the same (from base model to pro max)';
COMMENT ON COLUMN public.products.wholesale_price IS 'The wholesale price of the device';
COMMENT ON COLUMN public.product_items.wholesale_price IS 'The wholesale price of the device';

-- Create index on release_date for better query performance
CREATE INDEX IF NOT EXISTS idx_products_release_date ON public.products(release_date);

-- Create composite index on release_date and order for sorting
CREATE INDEX IF NOT EXISTS idx_products_release_date_order ON public.products(release_date, "order");

-- Create index on wholesale_price for better query performance
CREATE INDEX IF NOT EXISTS idx_products_wholesale_price ON public.products(wholesale_price);
CREATE INDEX IF NOT EXISTS idx_product_items_wholesale_price ON public.product_items(wholesale_price);


-- Update existing iPhone products with release dates and order
-- iPhone X series (2017)
UPDATE public.products SET release_date = '2017-11-03', "order" = 1, updated_at = NOW() WHERE name = 'iPhone X';
UPDATE public.products SET release_date = '2018-10-26', "order" = 1, updated_at = NOW() WHERE name = 'iPhone XR';
UPDATE public.products SET release_date = '2018-09-21', "order" = 1, updated_at = NOW() WHERE name = 'iPhone XS';
UPDATE public.products SET release_date = '2018-09-21', "order" = 2, updated_at = NOW() WHERE name = 'iPhone XS Max';

-- iPhone 11 series (2019)
UPDATE public.products SET release_date = '2019-09-20', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 11';
UPDATE public.products SET release_date = '2019-09-20', "order" = 2, updated_at = NOW() WHERE name = 'iPhone 11 Pro';
UPDATE public.products SET release_date = '2019-09-20', "order" = 3, updated_at = NOW() WHERE name = 'iPhone 11 Pro Max';

-- iPhone 12 series (2020)
UPDATE public.products SET release_date = '2020-10-23', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 12';
UPDATE public.products SET release_date = '2020-11-13', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 12 Mini';
UPDATE public.products SET release_date = '2020-10-23', "order" = 2, updated_at = NOW() WHERE name = 'iPhone 12 Pro';
UPDATE public.products SET release_date = '2020-10-23', "order" = 3, updated_at = NOW() WHERE name = 'iPhone 12 Pro Max';

-- iPhone 13 series (2021)
UPDATE public.products SET release_date = '2021-09-24', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 13';
UPDATE public.products SET release_date = '2021-09-24', "order" = 2, updated_at = NOW() WHERE name = 'iPhone 13 Mini';
UPDATE public.products SET release_date = '2021-09-24', "order" = 3, updated_at = NOW() WHERE name = 'iPhone 13 Pro';
UPDATE public.products SET release_date = '2021-09-24', "order" = 4, updated_at = NOW() WHERE name = 'iPhone 13 Pro Max';

-- iPhone 14 series (2022)
UPDATE public.products SET release_date = '2022-09-16', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 14';
UPDATE public.products SET release_date = '2022-10-07', "order" = 2, updated_at = NOW() WHERE name = 'iPhone 14 Plus';
UPDATE public.products SET release_date = '2022-09-16', "order" = 3, updated_at = NOW() WHERE name = 'iPhone 14 Pro';
UPDATE public.products SET release_date = '2022-09-16', "order" = 4, updated_at = NOW() WHERE name = 'iPhone 14 Pro Max';

-- iPhone 15 series (2023)
UPDATE public.products SET release_date = '2023-09-22', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 15';
UPDATE public.products SET release_date = '2023-09-22', "order" = 2, updated_at = NOW() WHERE name = 'iPhone 15 Plus';
UPDATE public.products SET release_date = '2023-09-22', "order" = 3, updated_at = NOW() WHERE name = 'iPhone 15 Pro';
UPDATE public.products SET release_date = '2023-09-22', "order" = 4, updated_at = NOW() WHERE name = 'iPhone 15 Pro Max';

-- iPhone 16 series (2024)
UPDATE public.products SET release_date = '2024-09-20', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 16';
UPDATE public.products SET release_date = '2024-09-20', "order" = 2, updated_at = NOW() WHERE name = 'iPhone 16 Plus';
UPDATE public.products SET release_date = '2024-09-20', "order" = 3, updated_at = NOW() WHERE name = 'iPhone 16 Pro';
UPDATE public.products SET release_date = '2024-09-20', "order" = 4, updated_at = NOW() WHERE name = 'iPhone 16 Pro Max';

-- iPhone 17 series (2025)
UPDATE public.products SET release_date = '2025-09-19', "order" = 1, updated_at = NOW() WHERE name = 'iPhone 17';
UPDATE public.products SET release_date = '2025-09-19', "order" = 2, updated_at = NOW() WHERE name = 'iPhone Air';
UPDATE public.products SET release_date = '2025-09-19', "order" = 3, updated_at = NOW() WHERE name = 'iPhone 17 Pro';
UPDATE public.products SET release_date = '2025-09-19', "order" = 4, updated_at = NOW() WHERE name = 'iPhone 17 Pro Max';
