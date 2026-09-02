// prisma/seed.ts
// Seed script for initial development data

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/plugins/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo',
      domain: null,
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

  // Create admin user
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

  // Create IT Asset Manager user
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

  // Create Field Technician user
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

  // Create default site
  const site = await prisma.site.upsert({
    where: {
      tenant_id_code: {
        tenant_id: tenant.id,
        code: 'HQ',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Headquarters',
      code: 'HQ',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postal_code: '94105',
      timezone: 'America/Los_Angeles',
      description: 'Main office building',
      is_active: true,
    },
  });
  console.log(`✅ Site created: ${site.name} (${site.id})`);

  // Create locations (building -> floor -> room)
  const building = await prisma.location.upsert({
    where: {
      tenant_id_site_id_code: {
        tenant_id: tenant.id,
        site_id: site.id,
        code: 'BLDG-A',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      site_id: site.id,
      name: 'Building A',
      code: 'BLDG-A',
      description: 'Main office building',
      parent_id: null,
      is_active: true,
    },
  });
  console.log(`✅ Building created: ${building.name} (${building.id})`);

  const floor1 = await prisma.location.upsert({
    where: {
      tenant_id_site_id_code: {
        tenant_id: tenant.id,
        site_id: site.id,
        code: 'FL-1',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      site_id: site.id,
      name: 'Floor 1',
      code: 'FL-1',
      description: 'First floor',
      parent_id: building.id,
      is_active: true,
    },
  });
  console.log(`✅ Floor created: ${floor1.name} (${floor1.id})`);

  const room101 = await prisma.location.upsert({
    where: {
      tenant_id_site_id_code: {
        tenant_id: tenant.id,
        site_id: site.id,
        code: 'RM-101',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      site_id: site.id,
      name: 'Room 101',
      code: 'RM-101',
      description: 'Conference room',
      parent_id: floor1.id,
      is_active: true,
    },
  });
  console.log(`✅ Room created: ${room101.name} (${room101.id})`);

  // Create categories
  const laptopCategory = await prisma.category.upsert({
    where: {
      tenant_id_code: {
        tenant_id: tenant.id,
        code: 'LAPTOP',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Laptops',
      code: 'LAPTOP',
      description: 'Laptop computers',
      color: '#3B82F6',
      icon: 'laptop',
      parent_id: null,
      is_active: true,
    },
  });
  console.log(`✅ Category created: ${laptopCategory.name} (${laptopCategory.id})`);

  const monitorCategory = await prisma.category.upsert({
    where: {
      tenant_id_code: {
        tenant_id: tenant.id,
        code: 'MONITOR',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Monitors',
      code: 'MONITOR',
      description: 'External monitors',
      color: '#8B5CF6',
      icon: 'monitor',
      parent_id: null,
      is_active: true,
    },
  });
  console.log(`✅ Category created: ${monitorCategory.name} (${monitorCategory.id})`);

  // Create departments
  const itDept = await prisma.department.upsert({
    where: {
      tenant_id_code: {
        tenant_id: tenant.id,
        code: 'IT',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Information Technology',
      code: 'IT',
      description: 'IT Department',
      cost_center: 'CC-001',
      manager_id: manager.id,
      is_active: true,
    },
  });
  console.log(`✅ Department created: ${itDept.name} (${itDept.id})`);

  const hrDept = await prisma.department.upsert({
    where: {
      tenant_id_code: {
        tenant_id: tenant.id,
        code: 'HR',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Human Resources',
      code: 'HR',
      description: 'HR Department',
      cost_center: 'CC-002',
      manager_id: null,
      is_active: true,
    },
  });
  console.log(`✅ Department created: ${hrDept.name} (${hrDept.id})`);

  // Create sample assets
  const asset1 = await prisma.asset.upsert({
    where: {
      tenant_id_normalized_tag: {
        tenant_id: tenant.id,
        normalized_tag: 'LT-00001',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      asset_tag: 'LT-00001',
      normalized_tag: 'LT-00001',
      serial_number: 'SN-LT-2024-001',
      make: 'Dell',
      model: 'Latitude 7440',
      category_id: laptopCategory.id,
      site_id: site.id,
      location_id: room101.id,
      department_id: itDept.id,
      custodian_user_id: admin.id,
      status: 'ASSIGNED',
      condition: 'Excellent',
      purchase_date: new Date('2024-01-15'),
      purchase_cost: 1299.99,
      currency: 'USD',
      warranty_expires: new Date('2027-01-15'),
      asset_tag_counter: 1,
      created_by_id: admin.id,
    },
  });
  console.log(`✅ Asset created: ${asset1.asset_tag} (${asset1.id})`);

  const asset2 = await prisma.asset.upsert({
    where: {
      tenant_id_normalized_tag: {
        tenant_id: tenant.id,
        normalized_tag: 'LT-00002',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      asset_tag: 'LT-00002',
      normalized_tag: 'LT-00002',
      serial_number: 'SN-LT-2024-002',
      make: 'Lenovo',
      model: 'ThinkPad X1 Carbon Gen 11',
      category_id: laptopCategory.id,
      site_id: site.id,
      location_id: room101.id,
      department_id: itDept.id,
      custodian_user_id: manager.id,
      status: 'ASSIGNED',
      condition: 'Good',
      purchase_date: new Date('2024-02-20'),
      purchase_cost: 1599.99,
      currency: 'USD',
      warranty_expires: new Date('2027-02-20'),
      asset_tag_counter: 2,
      created_by_id: admin.id,
    },
  });
  console.log(`✅ Asset created: ${asset2.asset_tag} (${asset2.id})`);

  const asset3 = await prisma.asset.upsert({
    where: {
      tenant_id_normalized_tag: {
        tenant_id: tenant.id,
        normalized_tag: 'MON-00001',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      asset_tag: 'MON-00001',
      normalized_tag: 'MON-00001',
      serial_number: 'SN-MON-2024-001',
      make: 'LG',
      model: '27UP850-W',
      category_id: monitorCategory.id,
      site_id: site.id,
      location_id: room101.id,
      department_id: itDept.id,
      custodian_user_id: null,
      status: 'IN_STOCK',
      condition: 'New',
      purchase_date: new Date('2024-03-10'),
      purchase_cost: 449.99,
      currency: 'USD',
      warranty_expires: new Date('2027-03-10'),
      asset_tag_counter: 1,
      created_by_id: admin.id,
    },
  });
  console.log(`✅ Asset created: ${asset3.asset_tag} (${asset3.id})`);

  // Create sample audit session
  const auditSession = await prisma.auditSession.create({
    data: {
      tenant_id: tenant.id,
      name: 'Q1 2025 Asset Audit',
      scope_type: 'SITE',
      scope_id: site.id,
      scope_name: site.name,
      status: 'SCHEDULED',
      due_at: new Date('2025-03-31'),
      timezone: 'UTC',
      lead_auditor_id: manager.id,
      total_assets: 3,
      notify_assignees: true,
      require_signature: true,
      require_photo: false,
      offline_enabled: true,
      created_by_id: admin.id,
    },
  });
  console.log(`✅ Audit session created: ${auditSession.name} (${auditSession.id})`);

  // Create audit items for the session
  for (const asset of [asset1, asset2, asset3]) {
    await prisma.auditSessionItem.create({
      data: {
        session_id: auditSession.id,
        asset_id: asset.id,
        expected_location_id: asset.location_id,
        status: 'MISSING',
      },
    });
  }
  console.log(`✅ Audit items created for session`);

  // Create sample maintenance work order
  const workOrder = await prisma.maintenanceWorkOrder.create({
    data: {
      tenant_id: tenant.id,
      wo_number: 'WO-2025-001',
      asset_id: asset1.id,
      type: 'PREVENTIVE',
      status: 'OPEN',
      priority: 3,
      title: 'Quarterly Laptop Maintenance',
      description: 'Routine cleaning and hardware check',
      technician_id: technician.id,
      due_date: new Date('2025-02-15'),
      created_by_id: admin.id,
      assigned_by_id: manager.id,
    },
  });
  console.log(`✅ Work order created: ${workOrder.wo_number} (${workOrder.id})`);

  // Create maintenance tasks
  await prisma.maintenanceTask.createMany({
    data: [
      {
        wo_id: workOrder.id,
        title: 'Clean keyboard and screen',
        description: 'Use compressed air and microfiber cloth',
        order: 1,
      },
      {
        wo_id: workOrder.id,
        title: 'Check battery health',
        description: 'Run battery diagnostics',
        order: 2,
      },
      {
        wo_id: workOrder.id,
        title: 'Verify SSD health',
        description: 'Check SMART status',
        order: 3,
      },
      {
        wo_id: workOrder.id,
        title: 'Update firmware/BIOS',
        description: 'Check for latest updates',
        order: 4,
      },
    ],
  });
  console.log(`✅ Maintenance tasks created`);

  // Create sample reservation
  await prisma.reservation.create({
    data: {
      tenant_id: tenant.id,
      asset_id: asset3.id,
      requester_id: technician.id,
      start_at: new Date('2025-02-01T09:00:00Z'),
      end_at: new Date('2025-02-01T17:00:00Z'),
      purpose: 'Client presentation',
      status: 'APPROVED',
      approved_at: new Date(),
      approver_id: manager.id,
    },
  });
  console.log(`✅ Reservation created`);

  // Create sample contract
  await prisma.contract.create({
    data: {
      tenant_id: tenant.id,
      name: 'Dell ProSupport Plus',
      contract_number: 'CTR-2024-001',
      type: 'WARRANTY',
      status: 'ACTIVE',
      vendor_id: null,
      value: 299.99,
      currency: 'USD',
      billing_cycle: 'ANNUAL',
      auto_renew: true,
      start_date: new Date('2024-01-15'),
      end_date: new Date('2027-01-15'),
      renewal_date: new Date('2026-12-16'),
      notice_period_days: 30,
      terms: 'ProSupport Plus for Dell Latitude laptops',
      sla_terms: 'Next business day onsite',
      owner_id: manager.id,
      created_by_id: admin.id,
    },
  });
  console.log(`✅ Contract created`);

  // Create default settings
  await prisma.setting.createMany({
    data: [
      {
        tenant_id: tenant.id,
        key: 'asset_tag_prefix',
        value: 'LT',
        scope: 'tenant',
      },
      {
        tenant_id: tenant.id,
        key: 'auto_assign_asset_tag',
        value: true,
        scope: 'tenant',
      },
      {
        tenant_id: tenant.id,
        key: 'audit_offline_enabled',
        value: true,
        scope: 'tenant',
      },
      {
        tenant_id: tenant.id,
        key: 'maintenance_default_priority',
        value: 3,
        scope: 'tenant',
      },
    ],
  });
  console.log(`✅ Default settings created`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Tenant: demo');
  console.log('   Admin:    admin@example.com    / Admin@123');
  console.log('   Manager:  manager@example.com  / Manager@123');
  console.log('   Tech:     tech@example.com     / Tech@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });