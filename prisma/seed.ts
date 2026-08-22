// Prisma Seed Script for Production
// Run with: npx prisma db seed

import { PrismaClient, UserRole, UserStatus, AssetStatus, AuditStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
      domain: 'demo.assetmt.local',
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      plan: 'ENTERPRISE',
      maxAssets: 10000,
      maxUsers: 100,
      maxStorageGb: 100,
      settings: {
        assetTagPrefix: 'AST',
        assetTagFormat: '{prefix}-{number:06d}',
        passwordMinLength: 12,
        passwordRequireUpper: true,
        passwordRequireLower: true,
        passwordRequireNumber: true,
        passwordRequireSymbol: true,
        passwordMaxAgeDays: 90,
        passwordHistoryCount: 5,
        mfaRequiredForAdmins: true,
        mfaRequiredForAll: false,
        sessionAbsoluteTimeoutMinutes: 15,
        sessionIdleTimeoutMinutes: 5,
        maxConcurrentSessions: 5,
        auditLogRetentionDays: 730,
        assetHistoryRetentionDays: 2555,
      },
    },
  });

  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // Create default roles if they don't exist
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Full system access across all tenants' },
    { name: 'TENANT_ADMIN', description: 'Full access within tenant' },
    { name: 'IT_ASSET_MANAGER', description: 'Manage assets, audits, maintenance' },
    { name: 'FIELD_TECHNICIAN', description: 'Field work: scans, maintenance tasks' },
    { name: 'EMPLOYEE', description: 'Basic access: view assigned assets' },
    { name: 'AUDITOR', description: 'Conduct and view audits' },
    { name: 'READ_ONLY', description: 'View-only access' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles created');

  // Create default admin user
  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      tenantId: tenant.id,
      mfaEnabled: false,
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en',
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email} (${adminUser.id})`);

  // Create sample sites
  const sites = [
    { name: 'Headquarters', code: 'HQ', city: 'New York', state: 'NY', country: 'USA', timezone: 'America/New_York' },
    { name: 'Warehouse A', code: 'WH-A', city: 'Los Angeles', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles' },
    { name: 'Warehouse B', code: 'WH-B', city: 'Chicago', state: 'IL', country: 'USA', timezone: 'America/Chicago' },
  ];

  for (const site of sites) {
    await prisma.site.upsert({
      where: { code_tenantId: { code: site.code, tenantId: tenant.id } },
      update: {},
      create: { ...site, tenantId: tenant.id },
    });
  }
  console.log('✅ Sites created');

  // Create categories
  const categories = [
    { name: 'Laptops', code: 'LPT', description: 'Portable computers' },
    { name: 'Desktops', code: 'DTP', description: 'Desktop computers' },
    { name: 'Monitors', code: 'MON', description: 'Display monitors' },
    { name: 'Mobile Devices', code: 'MOB', description: 'Phones and tablets' },
    { name: 'Network Equipment', code: 'NET', description: 'Switches, routers, access points' },
    { name: 'Servers', code: 'SRV', description: 'Server hardware' },
    { name: 'Peripherals', code: 'PER', description: 'Keyboards, mice, docks' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { code_tenantId: { code: category.code, tenantId: tenant.id } },
      update: {},
      create: { ...category, tenantId: tenant.id },
    });
  }
  console.log('✅ Categories created');

  // Create departments
  const departments = [
    { name: 'IT', code: 'IT', description: 'Information Technology' },
    { name: 'Engineering', code: 'ENG', description: 'Engineering Department' },
    { name: 'Sales', code: 'SAL', description: 'Sales Department' },
    { name: 'Marketing', code: 'MKT', description: 'Marketing Department' },
    { name: 'HR', code: 'HR', description: 'Human Resources' },
    { name: 'Finance', code: 'FIN', description: 'Finance Department' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code_tenantId: { code: dept.code, tenantId: tenant.id } },
      update: {},
      create: { ...dept, tenantId: tenant.id },
    });
  }
  console.log('✅ Departments created');

  // Create vendors
  const vendors = [
    { name: 'Dell', contactName: 'Enterprise Sales', email: 'sales@dell.com', phone: '1-800-624-9897' },
    { name: 'HP', contactName: 'Business Sales', email: 'business@hp.com', phone: '1-800-756-0608' },
    { name: 'Apple', contactName: 'Enterprise Team', email: 'enterprise@apple.com', phone: '1-800-692-7753' },
    { name: 'Lenovo', contactName: 'Business Sales', email: 'business@lenovo.com', phone: '1-855-253-6686' },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { name_tenantId: { name: vendor.name, tenantId: tenant.id } },
      update: {},
      create: { ...vendor, tenantId: tenant.id },
    });
  }
  console.log('✅ Vendors created');

  // Create sample assets
  const laptopCategory = await prisma.category.findFirst({ where: { code: 'LPT', tenantId: tenant.id } });
  const desktopCategory = await prisma.category.findFirst({ where: { code: 'DTP', tenantId: tenant.id } });
  const monitorCategory = await prisma.category.findFirst({ where: { code: 'MON', tenantId: tenant.id } });
  const hqSite = await prisma.site.findFirst({ where: { code: 'HQ', tenantId: tenant.id } });
  const whSite = await prisma.site.findFirst({ where: { code: 'WH-A', tenantId: tenant.id } });
  const itDept = await prisma.department.findFirst({ where: { code: 'IT', tenantId: tenant.id } });
  const dellVendor = await prisma.vendor.findFirst({ where: { name: 'Dell', tenantId: tenant.id } });
  const hpVendor = await prisma.vendor.findFirst({ where: { name: 'HP', tenantId: tenant.id } });

  const sampleAssets = [
    { assetTag: 'AST-LPT-000001', serialNumber: 'DL001234', make: 'Dell', model: 'Latitude 7430', categoryId: laptopCategory?.id, siteId: hqSite?.id, departmentId: itDept?.id, vendorId: dellVendor?.id, status: AssetStatus.ASSIGNED, condition: 'Excellent', purchaseDate: new Date('2023-01-15'), purchaseCost: 1499.99, currency: 'USD', warrantyExpires: new Date('2026-01-15') },
    { assetTag: 'AST-LPT-000002', serialNumber: 'DL001235', make: 'Dell', model: 'Latitude 7430', categoryId: laptopCategory?.id, siteId: hqSite?.id, departmentId: itDept?.id, vendorId: dellVendor?.id, status: AssetStatus.IN_STOCK, condition: 'New', purchaseDate: new Date('2023-02-01'), purchaseCost: 1499.99, currency: 'USD', warrantyExpires: new Date('2026-02-01') },
    { assetTag: 'AST-DTP-000001', serialNumber: 'HP001234', make: 'HP', model: 'EliteDesk 800 G9', categoryId: desktopCategory?.id, siteId: hqSite?.id, departmentId: itDept?.id, vendorId: hpVendor?.id, status: AssetStatus.ASSIGNED, condition: 'Good', purchaseDate: new Date('2022-11-01'), purchaseCost: 999.99, currency: 'USD', warrantyExpires: new Date('2025-11-01') },
    { assetTag: 'AST-MON-000001', serialNumber: 'DLM00123', make: 'Dell', model: 'UltraSharp 27', categoryId: monitorCategory?.id, siteId: hqSite?.id, departmentId: itDept?.id, vendorId: dellVendor?.id, status: AssetStatus.IN_STOCK, condition: 'New', purchaseDate: new Date('2023-03-01'), purchaseCost: 349.99, currency: 'USD', warrantyExpires: new Date('2026-03-01') },
  ];

  for (const asset of sampleAssets) {
    if (asset.categoryId && asset.siteId && asset.departmentId && asset.vendorId) {
      await prisma.asset.upsert({
        where: { assetTag: asset.assetTag },
        update: {},
        create: {
          ...asset,
          tenantId: tenant.id,
          createdById: adminUser.id,
        },
      });
    }
  }
  console.log('✅ Sample assets created');

  // Create maintenance types
  const maintenanceTypes = [
    { name: 'Preventive', description: 'Scheduled preventive maintenance' },
    { name: 'Corrective', description: 'Fix broken equipment' },
    { name: 'Calibration', description: 'Calibrate equipment' },
    { name: 'Inspection', description: 'Safety/compliance inspection' },
  ];

  for (const type of maintenanceTypes) {
    await prisma.maintenanceType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    });
  }
  console.log('✅ Maintenance types created');

  // Create audit statuses
  const auditStatuses = [
    { name: 'SCHEDULED', description: 'Audit scheduled but not started' },
    { name: 'IN_PROGRESS', description: 'Audit currently in progress' },
    { name: 'COMPLETED', description: 'Audit completed successfully' },
    { name: 'OVERDUE', description: 'Audit past due date' },
    { name: 'CANCELLED', description: 'Audit cancelled' },
  ];

  for (const status of auditStatuses) {
    await prisma.auditStatus.upsert({
      where: { name: status.name },
      update: {},
      create: status,
    });
  }
  console.log('✅ Audit statuses created');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });