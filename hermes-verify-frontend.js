const fs = require('fs');
const path = require('path');

console.log('=== Frontend Verification ===\n');

// 1. Verify Select.tsx exists and has expected exports
const selectPath = 'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/components/ui/Select.tsx';
if (fs.existsSync(selectPath)) {
  const content = fs.readFileSync(selectPath, 'utf-8');
  console.log('✅ Select.tsx exists');
  
  const exports = [
    'export { Select',
    'export { SelectComponent',
    'SelectPrimitive.Root',
    'SelectPrimitive.Trigger',
    'SelectPrimitive.Content',
    'SelectPrimitive.Item',
    'SelectPrimitive.ItemIndicator',
    'SelectPrimitive.ItemText',
    'SelectPrimitive.Value',
  ];
  
  exports.forEach(exp => {
    if (content.includes(exp)) {
      console.log(`  ✅ Export found: ${exp}`);
    } else {
      console.log(`  ❌ Missing export: ${exp}`);
    }
  });
} else {
  console.log('❌ Select.tsx NOT FOUND');
}

// 2. Verify helpers.ts has no duplicate keys
const helpersPath = 'C:/Users/Akash Hodlur/Projects/Asset_MaintanceTool/frontend/src/utils/helpers.ts';
if (fs.existsSync(helpersPath)) {
  const content = fs.readFileSync(helpersPath, 'utf-8');
  console.log('\n✅ helpers.ts exists');
  
  // Check for duplicate keys in getStatusColor
  const inProgressCount = (content.match(/in_progress:/g) || []).length;
  const completedCount = (content.match(/completed:/g) || []).length;
  
  if (inProgressCount > 1) console.log(`  ❌ in_progress appears ${inProgressCount} times`);
  else console.log('  ✅ in_progress appears once');
  
  if (completedCount > 1) console.log(`  ❌ completed appears ${completedCount} times`);
  else console.log('  ✅ completed appears once');
} else {
  console.log('\n❌ helpers.ts NOT FOUND');
}

// 3. Verify servers are running
const http = require('http');
function checkServer(port, path) {
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
  console.log('\n=== Server Health Checks ===');
  const frontend = await checkServer(3000, '/');
  console.log(frontend.ok ? '✅ Frontend (3000): OK' : `❌ Frontend (3000): ${frontend.status}`);
  
  const backend = await checkServer(3001, '/health');
  console.log(backend.ok ? '✅ Backend (3001): OK' : `❌ Backend (3001): ${backend.status}`);
  
  console.log('\n=== Verification Complete ===');
})();