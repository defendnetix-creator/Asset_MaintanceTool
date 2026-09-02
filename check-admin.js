const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  
  console.log('=== DATABASE STATE CHECK ===');
  
  // Check Tenant
  const tenants = await prisma.tenant.findMany({
    where: { slug: 'demo' }
  });
  console.log('Tenant (demo) count:', tenants.length);
  tenants.forEach(t => console.log(' -', t.id, '|', t.name, '| status:', t.status));
  
  // Check User with admin email
  const admin = await prisma.user.findFirst({ 
    where: { email: 'admin@example.com' },
    include: { tenant: true }
  });
  console.log('Admin user exists:', admin ? 'YES' : 'NO');
  if (admin) {
    console.log('  email:', admin.email);
    console.log('  role:', admin.role);
    console.log('  tenant_id:', admin.tenant_id);
    console.log('  tenant name:', admin.tenant?.name);
    console.log('  status:', admin.status);
    console.log('  password_hash present:', !!admin.password_hash);
    console.log('  first_name:', admin.first_name);
    console.log('  last_name:', admin.last_name);
  }
  
  // Check all users
  const allUsers = await prisma.user.findMany({
    include: { tenant: true }
  });
  console.log('All users count:', allUsers.length);
  allUsers.forEach(u => console.log(' -', u.email, '| role:', u.role, '| status:', u.status));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });