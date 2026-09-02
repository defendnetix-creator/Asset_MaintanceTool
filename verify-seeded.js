const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  
  console.log('=== DATABASE VERIFICATION ===');
  
  // Check admin user
  const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  if (admin) {
    console.log('✅ ADMIN USER FOUND');
    console.log('  email:', admin.email);
    console.log('  role:', admin.role);
    console.log('  status:', admin.status);
    console.log('  password_hash present:', !!admin.password_hash);
    console.log('  tenant_id:', admin.tenant_id);
    console.log('  first_name:', admin.first_name);
    console.log('  last_name:', admin.last_name);
  } else {
    console.log('❌ ADMIN USER NOT FOUND');
  }
  
  // Check tenant
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo' } });
  if (tenant) {
    console.log('✅ TENANT FOUND');
    console.log('  name:', tenant.name);
    console.log('  slug:', tenant.slug);
    console.log('  status:', tenant.status);
  } else {
    console.log('❌ TENANT NOT FOUND');
  }
  
  // Check all users
  const allUsers = await prisma.user.findMany();
  console.log('\\nAll users count:', allUsers.length);
  allUsers.forEach(u => {
    console.log(' -', u.email, '| role:', u.role, '| status:', u.status);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });