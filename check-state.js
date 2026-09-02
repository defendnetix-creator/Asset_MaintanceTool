const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./backend/src/plugins/auth.js');
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  
  // Check current state
  console.log('=== CURRENT DATABASE STATE ===');
  
  const tenants = await prisma.tenant.findMany();
  console.log('Tenant count:', tenants.length);
  tenants.forEach(t => console.log(' -', t.id, '|', t.name, '| slug:', t.slug));
  
  const users = await prisma.user.findMany({ include: { tenant: true } });
  console.log('User count:', users.length);
  users.forEach(u => console.log(' -', u.email, '| role:', u.role, '| tenant:', u.tenant?.name, '| status:', u.status, '| pw_hash:', !!u.password_hash));
  
  // Check admin
  const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  if (admin) {
    console.log('ADMIN EXISTS:', admin.email, 'role:', admin.role, 'status:', admin.status);
    console.log('  password_hash present:', !!admin.password_hash);
  } else {
    console.log('ADMIN NOT FOUND - WILL NEED SEED');
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });