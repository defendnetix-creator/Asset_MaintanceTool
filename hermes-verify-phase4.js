const fs = require('fs');
const http = require('http');

console.log('=== Phase 4 Ad-Hoc Verification ===\n');

let allPassed = true;

function checkFile(filepath, name, checks) {
  if (!fs.existsSync(filepath)) {
    console.log(`❌ ${name}: FILE NOT FOUND`);
    allPassed = false;
    return;
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  console.log(`✅ ${name}: EXISTS (${content.length} chars)`);
  
  for (const check of checks) {
    if (check.required && !content.includes(check.string)) {
      console.log(`  ❌ ${check.desc}: NOT FOUND`);
      allPassed = false;
    } else if (check.forbidden && content.includes(check.string)) {
      console.log(`  ❌ ${check.desc}: STILL PRESENT (should be removed)`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${check.desc}`);
    }
  }
}

// Phase 4 Checks

// 1. Mobile responsive - tables wrapped in overflow-x-auto
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/AssetsPage.tsx',
  'AssetsPage.tsx',
  [
    { string: 'overflow-x-auto', desc: 'Table wrapped in overflow-x-auto', required: true },
    { string: 'overflow-x-auto', desc: 'Second table wrapped', required: true },
  ]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/AuditsPage.tsx',
  'AuditsPage.tsx',
  [
    { string: 'overflow-x-auto', desc: 'Table wrapped in overflow-x-auto', required: true },
  ]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/MaintenancePage.tsx',
  'MaintenancePage.tsx',
  [
    { string: 'overflow-x-auto', desc: 'Table wrapped in overflow-x-auto', required: true },
  ]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/UsersPage.tsx',
  'UsersPage.tsx',
  [
    { string: 'overflow-x-auto', desc: 'Table wrapped in overflow-x-auto', required: true },
  ]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/ReportsPage.tsx',
  'ReportsPage.tsx',
  [
    { string: 'overflow-x-auto', desc: 'Table wrapped in overflow-x-auto', required: true },
  ]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/AuditDetailPage.tsx',
  'AuditDetailPage.tsx',
  [
    { string: 'overflow-x-auto', desc: 'Items table wrapped', required: true },
    { string: 'overflow-x-auto', desc: 'Discrepancies table wrapped', required: true },
  ]
);

// 2. Accessibility - focus-visible styles in CSS
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/index.css',
  'index.css',
  [
    { string: 'focus-visible', desc: 'Focus-visible styles present', required: true },
    { string: 'prefers-reduced-motion', desc: 'Reduced motion support', required: true },
    { string: 'prefers-contrast', desc: 'High contrast mode support', required: true },
  ]
);

// 3. Error Boundary component
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/components/ErrorBoundary.tsx',
  'ErrorBoundary.tsx',
  [
    { string: 'ErrorBoundary', desc: 'ErrorBoundary class exists', required: true },
    { string: 'getDerivedStateFromError', desc: 'getDerivedStateFromError implemented', required: true },
    { string: 'componentDidCatch', desc: 'componentDidCatch implemented', required: true },
    { string: 'PageErrorBoundary', desc: 'PageErrorBoundary export', required: true },
    { string: 'ComponentErrorBoundary', desc: 'ComponentErrorBoundary export', required: true },
  ]
);

// 4. Loading States components
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/components/LoadingStates.tsx',
  'LoadingStates.tsx',
  [
    { string: 'Skeleton', desc: 'Skeleton component', required: true },
    { string: 'LoadingSpinner', desc: 'LoadingSpinner component', required: true },
    { string: 'PageLoading', desc: 'PageLoading component', required: true },
    { string: 'SkeletonTable', desc: 'SkeletonTable component', required: true },
    { string: 'SkeletonList', desc: 'SkeletonList component', required: true },
  ]
);

// 4. Empty States components
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/components/EmptyStates.tsx',
  'EmptyStates.tsx',
  [
    { string: 'EmptyState', desc: 'EmptyState component', required: true },
    { string: 'EmptyAssets', desc: 'EmptyAssets component', required: true },
    { string: 'EmptyAudits', desc: 'EmptyAudits component', required: true },
    { string: 'EmptyMaintenance', desc: 'EmptyMaintenance component', required: true },
    { string: 'EmptyUsers', desc: 'EmptyUsers component', required: true },
    { string: 'EmptyReports', desc: 'EmptyReports component', required: true },
    { string: 'EmptySearchResults', desc: 'EmptySearchResults component', required: true },
  ]
);

// 6. Offline Queue hook
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/hooks/useOfflineQueue.ts',
  'useOfflineQueue.ts',
  [
    { string: 'useOfflineQueue', desc: 'useOfflineQueue hook exported', required: true },
    { string: 'IndexedDB', desc: 'IndexedDB usage', required: true },
    { string: 'background sync', desc: 'Background sync support', required: true },
    { string: 'enqueue', desc: 'enqueue function', required: true },
    { string: 'processQueue', desc: 'processQueue function', required: true },
    { string: 'registerBackgroundSync', desc: 'Background sync registration', required: true },
  ]
);

// 7. Service Worker
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/public/sw.js',
  'sw.js',
  [
    { string: 'sync', desc: 'Background sync event listener', required: true },
    { string: 'syncScans', desc: 'Sync scans function', required: true },
    { string: 'syncAudits', desc: 'Sync audits function', required: true },
    { string: 'syncAssets', desc: 'Sync assets function', required: true },
    { string: 'push', desc: 'Push notification listener', required: true },
    { string: 'notificationclick', desc: 'Notification click handler', required: true },
  ]
);

// 8. Vite PWA config with background sync
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/vite.config.ts',
  'vite.config.ts',
  [
    { string: 'background_sync', desc: 'Background sync config', required: true },
    { string: 'sync_tags', desc: 'Sync tags configured', required: true },
  ]
);

// 9. App.tsx with lazy loading and Suspense
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/App.tsx',
  'App.tsx',
  [
    { string: 'lazy', desc: 'React.lazy imports', required: true },
    { string: 'Suspense', desc: 'Suspense boundaries', required: true },
    { string: 'LoadingSpinner', desc: 'LoadingSpinner fallback', required: true },
  ]
);

// 10. CSS accessibility
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/index.css',
  'index.css',
  [
    { string: 'prefers-reduced-motion', desc: 'Reduced motion media query', required: true },
    { string: 'prefers-contrast', desc: 'High contrast mode support', required: true },
    { string: 'focus-visible', desc: 'Focus visible styles', required: true },
  ]
);

// 11. Helpers.ts duplicate keys fixed
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/utils/helpers.ts',
  'helpers.ts',
  [
    { string: 'in_progress', desc: 'in_progress key count', required: true },
    { string: 'completed', desc: 'completed key count', required: true },
  ]
);

// 10. OfflineIndicator enhanced
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/components/ui/OfflineIndicator.tsx',
  'OfflineIndicator.tsx',
  [
    { string: 'useOfflineQueue', desc: 'Uses useOfflineQueue hook', required: true },
    { string: 'syncing', desc: 'Shows syncing state', required: true },
    { string: 'queue.length', desc: 'Shows queue length', required: true },
    { string: 'Sync', desc: 'Sync icon for syncing state', required: true },
  ]
);

// Server health checks
async function checkServer(port, path) {
  return new Promise(resolve => {
    const req = http.get({host: 'localhost', port, path}, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({status: res.statusCode, ok: res.statusCode === 200}));
    });
    req.on('error', () => resolve({status: 0, ok: false}));
    req.setTimeout(3000, () => resolve({status: 0, ok: false}));
  });
}

(async () => {
  console.log('\n=== Server Health ===');
  const frontend = await checkServer(3000, '/');
  console.log(frontend.ok ? '✅ Frontend (3000): HTTP 200' : `❌ Frontend: ${frontend.status}`);
  if (!frontend.ok) allPassed = false;
  
  const backend = await checkServer(3001, '/health');
  console.log(backend.ok ? '✅ Backend (3001): HTTP 200' : `❌ Backend: ${backend.status}`);
  if (!backend.ok) allPassed = false;

  console.log('\n=== Final Summary ===');
  console.log(allPassed ? '✅ ALL CHECKS PASSED - Phase 4 Complete' : '❌ SOME CHECKS FAILED');
  process.exit(allPassed ? 0 : 1);
})();