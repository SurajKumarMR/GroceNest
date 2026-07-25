import fs from 'fs';
import path from 'path';
import { auditIndexes } from '../../../scripts/audit-db-indexes';

describe('Database Indexes Unit & Audit Tests', () => {
    const prismaDir = path.resolve(__dirname, '../../../prisma');
    const schemaPath = path.join(prismaDir, 'schema.prisma');

    describe('Acceptance Criteria 1 & 2: Single Column Indexes (userId, orderId, merchantId, createdAt, updatedAt)', () => {
        it('schema.prisma contains index declarations for identifier and timestamp fields', () => {
            const content = fs.readFileSync(schemaPath, 'utf-8');

            // Foreign keys / identifiers
            expect(content).toContain('@@index([userId])');
            expect(content).toContain('@@index([orderId])');
            expect(content).toContain('@@index([ownerId])');
            expect(content).toContain('@@index([driverId])');

            // Timestamps
            expect(content).toContain('@@index([createdAt])');
            expect(content).toContain('@@index([updatedAt])');
        });
    });

    describe('Acceptance Criteria 3: Composite Indexes on Common Filters', () => {
        it('schema.prisma contains composite index declarations for multi-field filtering', () => {
            const content = fs.readFileSync(schemaPath, 'utf-8');

            // Order filter composites
            expect(content).toContain('@@index([userId, status])');
            expect(content).toContain('@@index([storeId, status])');
            expect(content).toContain('@@index([driverId, status])');

            // Store & Product filter composites
            expect(content).toContain('@@index([ownerId, isActive])');
            expect(content).toContain('@@index([storeId, categoryId])');

            // Payment & Notification composites
            expect(content).toContain('@@index([userId, isDefault])');
            expect(content).toContain('@@index([userId, isRead])');
            expect(content).toContain('@@index([orderId, createdAt])');
            expect(content).toContain('@@index([driverId, createdAt])');
            expect(content).toContain('@@index([eventName, timestamp])');
        });
    });

    describe('Acceptance Criteria 4: Database Audit Script Execution & Index Verification', () => {
        it('executes database audit and confirms hot path index coverage', async () => {
            const result = await auditIndexes();
            expect(result.totalIndexes).toBeGreaterThanOrEqual(100);
            expect(result.allIndexesVerified).toBe(true);
        });
    });
});
