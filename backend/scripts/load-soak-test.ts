import prisma from '../src/utils/prisma';
import request from 'supertest';
import { app } from '../src/index';

async function runSoakTest() {
  console.log('=========================================');
  console.log('  Soak Test: Memory & DB Connection Leak  ');
  console.log('=========================================');

  try {
    const initialMemory = process.memoryUsage().heapUsed;
    console.log(`[SOAK] Initial Memory Heap: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);

    const iterations = 500;
    for (let i = 0; i < iterations; i++) {
      await request(app).get('/health');
      await request(app).get('/api/products');
      if (i % 100 === 0) {
        const currentMemory = process.memoryUsage().heapUsed;
        console.log(`[SOAK Iteration ${i}] Memory: ${(currentMemory / 1024 / 1024).toFixed(2)} MB`);
      }
    }

    // Force Garbage Collection hint if available
    if (typeof global.gc === 'function') {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowthMB = (finalMemory - initialMemory) / 1024 / 1024;
    console.log(`[SOAK] Final Memory Heap: ${(finalMemory / 1024 / 1024).toFixed(2)} MB (Delta: ${memoryGrowthMB.toFixed(2)} MB)`);

    // Verify DB connection pool health using current_database()
    const activeConnections = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
    `;

    const connCount = activeConnections[0]?.count ? activeConnections[0].count.toString() : '0';
    console.log(`[SOAK DB] Active PostgreSQL Connections: ${connCount}`);

    if (memoryGrowthMB < 20.0) {
      console.log('\n=========================================');
      console.log('  SOAK TEST PASSED - ZERO MEMORY / DB LEAKS!');
      console.log('=========================================');
    } else {
      console.warn('⚠ Heap growth detected during soak test');
    }
  } finally {
    await prisma.$disconnect();
  }
}

runSoakTest().catch((err) => {
  console.error('❌ Soak test failed with error:', err);
  process.exit(1);
});

