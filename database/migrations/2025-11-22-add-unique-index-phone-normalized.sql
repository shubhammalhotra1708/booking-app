-- Create unique index on phone_normalized now that duplicates are resolved.
-- Safe to run once verification queries show 0 duplicate phone_normalized values.
-- Uses CONCURRENTLY to avoid long table locks.

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS customer_phone_normalized_unique
ON public."Customer" (phone_normalized);

-- Optional supporting index for frequent lookup by legacy phone (if still queried often)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS customer_phone_legacy_idx ON public."Customer" (phone);
