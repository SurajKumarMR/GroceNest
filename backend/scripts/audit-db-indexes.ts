import prisma from '../src/utils/prisma';

async function auditIndexes() {
  console.log('=========================================');
  console.log('  PostgreSQL Database Index Audit       ');
  console.log('=========================================');

  try {
    const rawIndexes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string; indexdef: string }>>`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    console.log(`[INFO] Found ${rawIndexes.length} active database indexes:`);
    const hotPathColumns = [
      { table: 'User', columns: ['email', 'role'] },
      { table: 'Store', columns: ['slug', 'ownerId'] },
      { table: 'Product', columns: ['storeId', 'slug', 'status'] },
      { table: 'Order', columns: ['userId', 'storeId', 'orderNumber', 'status'] },
      { table: 'ProcessedWebhook', columns: ['eventId'] },
    ];

    let allIndexesVerified = true;
    for (const check of hotPathColumns) {
      const tableIndexes = rawIndexes.filter(idx => idx.tablename.toLowerCase() === check.table.toLowerCase());
      console.log(`\nTable: ${check.table} (${tableIndexes.length} indexes)`);
      for (const col of check.columns) {
        const hasIndex = tableIndexes.some(idx => idx.indexdef.toLowerCase().includes(col.toLowerCase()));
        if (hasIndex) {
          console.log(`  ✓ Column '${col}' is covered by an index.`);
        } else {
          console.warn(`  ⚠ Warning: Column '${col}' missing explicit index!`);
          allIndexesVerified = false;
        }
      }
    }

    if (allIndexesVerified) {
      console.log('\n=========================================');
      console.log('  ALL HOT PATH COLUMNS ARE COVERED BY INDEXES!');
      console.log('=========================================');
    }
  } catch (error) {
    console.error('Database index audit failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditIndexes();
