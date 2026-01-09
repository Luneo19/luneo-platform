// Test des imports
try {
  require.resolve('./src/components/marketing/home/index.ts');
  console.log('✅ index.ts OK');
} catch(e) {
  console.log('❌ index.ts:', e.message);
}

try {
  require.resolve('./src/components/animations/index.ts');
  console.log('✅ animations/index.ts OK');
} catch(e) {
  console.log('❌ animations/index.ts:', e.message);
}
