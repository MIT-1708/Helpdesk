async function globalTeardown() {
  console.log('\n=== PLAYWRIGHT GLOBAL TEARDOWN ===');
  // You can add teardown tasks here (e.g. dropping the test schema, stopping containers, etc.)
  console.log('Cleanup finished.');
  console.log('=== PLAYWRIGHT GLOBAL TEARDOWN COMPLETE ===\n');
}

export default globalTeardown;
