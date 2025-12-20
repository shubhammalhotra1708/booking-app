-- Check StaffService table contents
SELECT * FROM "StaffService" ORDER BY staffid, serviceid;

-- Check Staff table
SELECT id, name, shop_id, is_active FROM "Staff" WHERE shop_id = 20;

-- Check Service table  
SELECT id, name, shop_id, is_active FROM "Service" WHERE shop_id = 20;
