-- Add 'in-repair' to item_status enum
ALTER TYPE item_status ADD VALUE 'in-repair';

-- Add technician column to used_product_items table
ALTER TABLE used_product_items ADD COLUMN technician TEXT;
