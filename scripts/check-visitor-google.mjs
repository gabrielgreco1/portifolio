// Historical and live points now share one surface. Keep the prior command as an alias.
process.env.TEST_OFFLINE='1';
await import('./check-visitor-unified.mjs');
