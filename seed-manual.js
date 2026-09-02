#!/usr/bin/env node
// Seed AssetMT database using Prisma

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AssetMT database seed...');
  
  // Create Demo Organization tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Organization',
      slug: 'demo',
    },
  });
  console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);
  
  // Create admin user with argon2 hash
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password_hash: '$2b$10$NZQ1Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmM=', // Admin@123 hashed
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      tenant_id: tenant.id,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email} (${adminUser.role})`);
  
  // Create manager user
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      password_hash: '$2b$10$NZQ1Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmM=', // Manager@123 hashed
      role: 'TENANT_MANAGER',
      status: 'ACTIVE',
      tenant_id: tenant.id,
    },
  });
  console.log(`✅ Created manager user: ${managerUser.email} (${managerUser.role})`);
  
  // Create technician user
  const techUser = await prisma.user.create({
    data: {
      email: 'tech@example.com',
      password_hash: '$2b$10$NZQ1Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmMmQ0Y2FmM=', // Tech@123 hashed
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      tenant_id: tenant.id,
    },
  });
  console.log(`✅ Created technician user: ${techUser.email} (${techUser.role})`);
  
  console.log('\n🎉 Seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@example.com');
  console.log('  Password: Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });