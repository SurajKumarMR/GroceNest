import prisma from '../src/utils/prisma';

export async function auditIndexes() {
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

    console.log(`[INFO] Found ${rawIndexes.length} active database indexes.`);
    const hotPathColumns = [
      { table: 'User', columns: ['email', 'role', 'createdAt', 'updatedAt'] },
      { table: 'Store', columns: ['slug', 'ownerId', 'isActive', 'createdAt'] },
      { table: 'Product', columns: ['storeId', 'slug', 'status', 'categoryId', 'createdAt', 'updatedAt'] },
      { table: 'Order', columns: ['userId', 'storeId', 'driverId', 'orderNumber', 'status', 'paymentStatus', 'createdAt', 'updatedAt'] },
      { table: 'OrderItem', columns: ['orderId', 'productId', 'productVariantId', 'createdAt'] },
      { table: 'OrderStatusHistory', columns: ['orderId', 'createdBy', 'createdAt'] },
      { table: 'Review', columns: ['orderId', 'userId', 'storeId', 'productId', 'createdAt'] },
      { table: 'PaymentMethod', columns: ['userId', 'billingAddressId', 'isDefault'] },
      { table: 'DriverLocation', columns: ['driverId', 'orderId', 'createdAt'] },
      { table: 'Notification', columns: ['userId', 'isRead', 'createdAt'] },
      { table: 'NotificationLog', columns: ['userId', 'status', 'type', 'sentAt'] },
      { table: 'AnalyticsEvent', columns: ['eventName', 'timestamp', 'userId'] },
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
      console.log('  ALL HOT PATH & COMPOSITE COLUMNS ARE COVERED BY INDEXES!');
      console.log('=========================================');
    } else {
      console.warn('\nSome columns are missing indexes!');
    }

    return { totalIndexes: rawIndexes.length, allIndexesVerified };
  } catch (error) {
    console.error('Database index audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  auditIndexes().catch(() => process.exit(1));
}
