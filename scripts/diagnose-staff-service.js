// Diagnostic script to check StaffService mappings
// Run with: node scripts/diagnose-staff-service.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Make sure .env.local is loaded.');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('\n🔍 STAFF-SERVICE DIAGNOSTIC REPORT\n');
  console.log('='.repeat(60));

  // 1. Check all shops
  console.log('\n📍 SHOPS:');
  const { data: shops } = await supabase
    .from('Shop')
    .select('id, name, is_active')
    .order('id');
  
  shops?.forEach(shop => {
    console.log(`  ${shop.is_active ? '✅' : '❌'} Shop ${shop.id}: ${shop.name}`);
  });

  // 2. Check all services
  console.log('\n🛠️  SERVICES:');
  const { data: services } = await supabase
    .from('Service')
    .select('id, name, shop_id, category, duration, is_active')
    .order('shop_id', 'id');
  
  services?.forEach(service => {
    console.log(`  ${service.is_active ? '✅' : '❌'} Service ${service.id}: "${service.name}" (Shop ${service.shop_id}, ${service.category}, ${service.duration}min)`);
  });

  // 3. Check all staff
  console.log('\n👥 STAFF:');
  const { data: staff } = await supabase
    .from('Staff')
    .select('id, name, shop_id, is_active')
    .order('shop_id', 'id');
  
  staff?.forEach(s => {
    console.log(`  ${s.is_active ? '✅' : '❌'} Staff ${s.id}: "${s.name}" (Shop ${s.shop_id})`);
  });

  // 4. Check StaffService mappings
  console.log('\n🔗 STAFF-SERVICE MAPPINGS:');
  const { data: mappings } = await supabase
    .from('StaffService')
    .select(`
      staffid,
      serviceid,
      Staff!inner(id, name, shop_id),
      Service!inner(id, name)
    `)
    .order('staffid', 'serviceid');
  
  if (!mappings || mappings.length === 0) {
    console.log('  ⚠️  NO MAPPINGS FOUND!');
    console.log('  ⚠️  This means no staff are linked to any services.');
  } else {
    mappings?.forEach(m => {
      console.log(`  ✅ Staff ${m.staffid} (${m.Staff.name}) → Service ${m.serviceid} (${m.Service.name})`);
    });
  }

  // 5. Analysis
  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS:\n');

  if (!mappings || mappings.length === 0) {
    console.log('❌ CRITICAL ISSUE: StaffService table is EMPTY');
    console.log('');
    console.log('🔧 SOLUTION:');
    console.log('You need to link staff to services. For each service:');
    console.log('');
    services?.forEach(service => {
      const shopStaff = staff?.filter(s => s.shop_id === service.shop_id && s.is_active);
      if (shopStaff && shopStaff.length > 0) {
        console.log(`Service ${service.id} "${service.name}":`);
        shopStaff.forEach(s => {
          console.log(`  INSERT INTO "StaffService" (staffid, serviceid) VALUES (${s.id}, ${service.id});`);
        });
      }
    });
  } else {
    // Check for orphaned services (services with no staff)
    const orphanedServices = services?.filter(service => {
      const hasMappings = mappings.some(m => m.serviceid === service.id);
      return service.is_active && !hasMappings;
    });

    if (orphanedServices && orphanedServices.length > 0) {
      console.log('⚠️  ORPHANED SERVICES (no staff assigned):');
      orphanedServices.forEach(service => {
        console.log(`  - Service ${service.id}: "${service.name}" (Shop ${service.shop_id})`);
      });
    } else {
      console.log('✅ All active services have staff mappings');
    }
  }

  console.log('\n' + '='.repeat(60));
}

diagnose().catch(console.error);
