-- Service-type sale lines: add sale_line_type enum and columns to sale_reservation_items
-- Production-safe: additive only, backfill existing rows, default for legacy inserts.

-- 1. Create enum
CREATE TYPE sale_line_type AS ENUM ('device', 'accessory', 'service');

-- 2. Add columns as nullable
ALTER TABLE public.sale_reservation_items
  ADD COLUMN sale_line_type sale_line_type NULL,
  ADD COLUMN item_cost DECIMAL(10,2) NULL,
  ADD COLUMN linked_product_item_id UUID REFERENCES public.product_items(id) ON DELETE SET NULL;

-- 3. Backfill: existing rows have either product_item_id or accessory_item_id
UPDATE public.sale_reservation_items
SET sale_line_type = 'accessory'
WHERE accessory_item_id IS NOT NULL;

UPDATE public.sale_reservation_items
SET sale_line_type = 'device'
WHERE sale_line_type IS NULL;

-- 4. Set NOT NULL and default for sale_line_type
ALTER TABLE public.sale_reservation_items
  ALTER COLUMN sale_line_type SET DEFAULT 'device',
  ALTER COLUMN sale_line_type SET NOT NULL;

-- 5. Optional: check constraint for service lines (no inventory FKs, cost required)
ALTER TABLE public.sale_reservation_items
  ADD CONSTRAINT chk_service_line
  CHECK (
    (sale_line_type != 'service') OR (
      product_item_id IS NULL
      AND accessory_item_id IS NULL
      AND item_cost IS NOT NULL
    )
  );
