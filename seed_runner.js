#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./backend/src/plugins/auth.js');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Create default tenant (slug: 'demo')
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo',
      plan: 'ENTERPRISE',
      max_assets: 10000,
      max_users: 500,
      max_storage_gb: 100,
      settings: {
        theme: 'light',
        language: 'en',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        currency: 'USD',
        timezone: 'UTC',
        email_notifications: true,
        slack_integration: false,
        teams_integration: false,
      },
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);
  
  // Create admin user with password Admin@123 hashed via argon2
  const passwordHash = await hashPassword('Admin@123');
  const admin = await prisma.user.upsert({
    where: {
      tenant_id_email: {
        tenant_id: tenant.id,
        email: 'admin@example.com',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'admin@example.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      timezone: 'UTC',
      language: 'en',
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (${admin.id})`);
  
  // Create manager user
  const managerHash = await hashPassword('Manager@123');
  const manager = await prisma.user.upsert({
    where: {
      tenant_id_email: {
        tenant_id: tenant.id,
        email: 'manager@example.com',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'manager@example.com',
      password_hash: managerHash,
      first_name: 'Asset',
      last_name: 'Manager',
      role: 'IT_ASSET_MANAGER',
      status: 'ACTIVE',
      timezone: 'UTC',
      language: 'en',
    },
  });
  console.log(`✅ Manager user created: ${manager.email} (${manager.id})`);
  
  // Create technician user
  const techHash = await hashPassword('Tech@123');
  const technician = await prisma.user.upsert({
    where: {
      tenant_id_email: {
        tenant_id: tenant.id,
        email: 'tech@example.com',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'tech@example.com',
      password_hash: techHash,
      first_name: 'Field',
      last_name: 'Technician',
      role: 'FIELD_TECHNICIAN',
      status: 'ACTIVE',
      timezone: 'UTC',
      language: 'en',
    },
  });
  console.log(`✅ Technician user created: ${technician.email} (${technician.id})`);
  
  console.log('\n🌱 Seed completed successfully!');
  console.log('Credentials:');
  console.log('  admin@example.com / Admin@123 (TENANT_ADMIN)');
  console.log('  manager@example.com / Manager@123 (IT_ASSET_MANAGER)');
  console.log('  tech@example.com / Tech@123 (FIELD_TECHNICIAN)');
}

main().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});