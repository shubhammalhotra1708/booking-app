-- Check StaffService mappings
SELECT 'StaffService mappings:' as info;
SELECT * FROM "StaffService" WHERE serviceid = 76;

-- Check Staff for this shop
SELECT 'Active Staff in shop 20:' as info;
SELECT id, name, shop_id, is_active FROM "Staff" WHERE shop_id = 20;

-- Check the service
SELECT 'Service details:' as info;
SELECT id, name, shop_id, is_active FROM "Service" WHERE id = 76;
