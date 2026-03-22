-- Add 'lost' to item_status enum
ALTER TYPE item_status ADD VALUE 'lost';

-- Add 'isOnSale' column to product_items and accessory_items tables
ALTER TABLE public.product_items ADD COLUMN "is_on_sale" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.accessory_items ADD COLUMN "is_on_sale" BOOLEAN NOT NULL DEFAULT false;
