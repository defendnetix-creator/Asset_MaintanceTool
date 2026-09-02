const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() { await prisma.$connect();
const tenants = await prisma.tenant.findMany();
console.log('Tenant count:', tenants.length);
const users = await prisma.user.findMany({ include: { tenant: true } });
console.log('User count:', users.length);
users.forEach(u => console.log(' -', u.email, '| role:', u.role, '| status:', u.status));
const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
if (admin) { console.log('ADMIN FOUND:', admin.email, 'role:', admin.role, 'tenant:', admin.tenant_id, 'status:', admin.status); }
else { console.log('ADMIN NOT FOUND'); }
await prisma.$disconnect(); }
main().catch(e => { console.error(e); process.exit(1); }); }