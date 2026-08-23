// playwright-check.js
// Playwright script to check for console errors and network issues

const { chromium } = require('playwright');

async function checkApplication() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const networkErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('/api/auth/me')) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Login page loaded');

    // Check for login form
    const usernameInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Login form found');

    // Fill login
    await usernameInput.fill('admin@example.com');
    await passwordInput.fill('Admin@123456');
    await loginButton.click();

    // Wait for navigation to dashboard (root path)
    await page.waitForURL('http://localhost:3000/', { timeout: 30000 });
    console.log('Dashboard loaded');

    // Check dashboard elements
    await page.waitForLoadState('networkidle');
    console.log('Dashboard network idle');

  } catch (error) {
    console.error('Test error:', error.message);
  }

  // Navigate to other pages and check
  const pages = [
    { url: 'http://localhost:3000/assets', name: 'Assets' },
    { url: 'http://localhost:3000/audits', name: 'Audits' },
    { url: 'http://localhost:3000/maintenance', name: 'Maintenance' },
    { url: 'http://localhost:3000/users', name: 'Users' },
    { url: 'http://localhost:3000/reports', name: 'Reports' },
    { url: 'http://localhost:3000/settings', name: 'Settings' },
  ];

  for (const p of pages) {
    try {
      console.log(`\nChecking ${p.name} page...`);
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`${p.name} page loaded`);
      await page.waitForTimeout(2000);
    } catch (error) {
      console.error(`Error loading ${p.name}:`, error.message);
    }
  }

  await browser.close();

  // Report results
  console.log('\n========== ERROR REPORT ==========');
  console.log('\nConsole Errors:');
  consoleErrors.forEach(e => console.log('  -', e));

  console.log('\nPage Errors:');
  pageErrors.forEach(e => console.log('  -', e));

  console.log('\nNetwork Errors (4xx/5xx) excluding /api/auth/me:');
  networkErrors.forEach(e => console.log(`  - ${e.status} ${e.url}`));

  console.log('\n========== SUMMARY ==========');
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Page Errors: ${pageErrors.length}`);
  console.log(`Network Errors: ${networkErrors.length}`);
}

checkApplication().catch(console.error);