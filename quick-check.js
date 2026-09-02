#!/usr/bin/env node
// Simple database verification and login test

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./backend/src/plugins/auth.js');
const prisma = new PrismaClient();

async function main() {
  console.log('=== ASSETMT DATABASE VERIFICATION ===\n');
  
  // Connect
  await prisma.$connect();
  
  // Check tenant
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo' } });
  console.log('1. Tenant (demo):', tenant ? `FOUND - ${tenant.name} (${tenant.id})` : 'NOT FOUND');
  
  // Check admin user
  const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  console.log('2. Admin user:', admin ? `FOUND - ${admin.email}, role=${admin.role}, status=${admin.status}, pw_hash=${!!admin.password_hash}` : 'NOT FOUND');
  
  // Check all users
  const allUsers = await prisma.user.findMany();
  console.log(`3. All users count: ${allUsers.length}`);
  allUsers.forEach(u => {
    console.log(`   - ${u.email} | role=${u.role} | status=${u.status} | pw_hash=${!!u.password_hash}`);
  });
  
  // Try login verification manually
  if (admin && admin.password_hash) {
    console.log('\n4. Manual login verification:');
    try {
      const valid = await hashPassword('Admin@123'); // This will fail since we're just checking structure
      console.log('   hashPassword function available');
    } catch(e) {
      console.log('   hashPassword error:', e.message.substring(0, 100));
    }
  }
  
  await prisma.$disconnect();
  console.log('\n=== VERIFICATION COMPLETE ===');
}

main().catch(e => { console.error('Error:', e); process.exit(1); });