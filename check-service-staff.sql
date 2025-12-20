-- Check Service active status
SELECT id, name, is_active, duration_minutes, price 
FROM "Service" 
WHERE id IN (76, 77);

-- Check Staff active status
SELECT id, name, is_active, shop_id 
FROM "Staff" 
WHERE shop_id = 20;
