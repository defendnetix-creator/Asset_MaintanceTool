#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// First connect
async function main() {
  await prisma.$connect();
  
  // Check what tables exist and data
  console.log('=== DATABASE STATE ===');
  
  // Check Tenant
  const tenants = await prisma.tenant.findMany();
  console.log('Tenant count:', tenants.length);
  tenants.forEach(t => {
    console.log(' -', t.id, '|', t.name, '| slug:', t.slug);
  });
  
  // Check User
  const users = await prisma.user.findMany({
    include: { tenant: true }
  });
  console.log('User count:', users.length);
  users.forEach(u => {
    console.log(' -', u.email, '| role:', u.role, '| tenant:', u.tenant?.name, '| status:', u.status);
    console.log('   password_hash populated:', !!u.password_hash);
  });
  
  // Check the admin specifically
  const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  if (admin) {
    console.log('=== ADMIN USER EXISTS ===');
    console.log(' email:', admin.email);
    console.log(' role:', admin.role);
    console.log(' tenant_id:', admin.tenant_id);
    console.log(' tenant name:', admin.tenant?.name);
    console.log(' status:', admin.status);
    console.log(' password_hash:', admin.password_hash ? 'PRESENT (first 20 chars: ' + admin.password_hash.substring(0, 20) + ')' : 'MISSING');
  } else {
    console.log('=== ADMIN USER NOT FOUND ===');
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});