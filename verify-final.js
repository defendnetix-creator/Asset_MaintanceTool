const fs = require('fs');
const http = require('http');

console.log('=== Final Phase 3 Verification ===\n');

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
    if (content.includes(check.forbidden)) {
      console.log(`  ❌ ${check.desc}: FOUND (should be removed)`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${check.desc}: NOT FOUND (correctly removed)`);
    }
  }
}

// Check all pages for duplicate imports removed
checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/AdminPage.tsx',
  'AdminPage.tsx',
  [{ forbidden: '// Add imports', desc: 'Duplicate import comment' }]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/SettingsPage.tsx',
  'SettingsPage.tsx',
  [{ forbidden: "import { Loader2 } from 'lucide-react';", desc: 'Duplicate Loader2 import at bottom' }]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/AssetDetailPage.tsx',
  'AssetDetailPage.tsx',
  [{ forbidden: '// Add missing imports', desc: 'Duplicate import comment' }]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/UsersPage.tsx',
  'UsersPage.tsx',
  [{ forbidden: "import { Search, Users, ChevronLeft, ChevronRight, MoreHorizontal, Loader2, Shield, Key, UserX, Trash2 }", desc: 'Duplicate lucide-react imports at bottom' }]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/AssetsPage.tsx',
  'AssetsPage.tsx',
  [{ forbidden: '// Add ChevronUp import', desc: 'Duplicate import comment' }]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/ReportsPage.tsx',
  'ReportsPage.tsx',
  [{ forbidden: "import { TrendingUp, MoreHorizontal, Loader2 }", desc: 'Duplicate import at bottom' }]
);

checkFile(
  'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/pages/AuditDetailPage.tsx',
  'AuditDetailPage.tsx',
  [{ forbidden: '// Add formatDateTime import', desc: 'Duplicate import comment' }]
);

// Check Select.tsx
const selectPath = 'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/components/ui/Select.tsx';
if (fs.existsSync(selectPath)) {
  console.log('\n✅ Select.tsx: EXISTS');
} else {
  console.log('\n❌ Select.tsx: NOT FOUND');
  allPassed = false;
}

// Check helpers.ts
const helpersPath = 'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/utils/helpers.ts';
if (fs.existsSync(helpersPath)) {
  const content = fs.readFileSync(helpersPath, 'utf-8');
  const inProgress = (content.match(/in_progress:/g) || []).length;
  const completed = (content.match(/completed:/g) || []).length;
  console.log('\n✅ helpers.ts: EXISTS');
  console.log(`  in_progress count: ${inProgress} (${inProgress === 1 ? '✅' : '❌'})`);
  console.log(`  completed count: ${completed} (${completed === 1 ? '✅' : '❌'})`);
  if (inProgress > 1 || completed > 1) allPassed = false;
} else {
  console.log('\n❌ helpers.ts: NOT FOUND');
  allPassed = false;
}

// Server health
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
  console.log(allPassed ? '✅ ALL CHECKS PASSED - Phase 3 Complete' : '❌ SOME CHECKS FAILED');
  process.exit(allPassed ? 0 : 1);
})();