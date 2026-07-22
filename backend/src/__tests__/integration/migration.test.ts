/**
 * Migration Test — Schema Apply from Zero
 *
 * Verifies that the Prisma schema can be applied to a clean Postgres database
 * from scratch without requiring any manual SQL steps.
 *
 * Strategy:
 * 1. Runs `prisma db push --force-reset` against the Postgres test database
 *    (equivalent to applying the schema from zero).
 * 2. Confirms the schema applied successfully by checking that key tables exist
 *    and have the expected columns.
 * 3. Confirms a basic Prisma CRUD operation works on the fresh schema.
 */

import { execSync } from 'child_process';
import { Client } from 'pg';
import path from 'path';

const ORIGINAL_DB_URL = process.env.DATABASE_URL || '';

describe('@migration Schema Migration from Zero', () => {
    let pgConn: Client;

    jest.setTimeout(120_000);

    beforeAll(async () => {
        pgConn = new Client({
            connectionString: ORIGINAL_DB_URL,
        });
        await pgConn.connect();
    });

    afterAll(async () => {
        if (pgConn) {
            await pgConn.end().catch(() => {});
        }
    });

    // ─── Step 1: Apply schema from zero via prisma db push ───────────────────

    describe('Step 1: Apply schema from zero', () => {
        it('prisma db push runs without error on a clean database', () => {
            const rootDir = path.resolve(__dirname, '../../../');

            const result = execSync(
                'npx prisma db push --force-reset --accept-data-loss',
                {
                    cwd: rootDir,
                    encoding: 'utf-8',
                    stdio: 'pipe',
                }
            );

            expect(result).not.toContain('Error:');
            expect(result).not.toContain('failed');
        });
    });

    // ─── Step 2: Verify key tables exist ──────────────────────────────────────

    describe('Step 2: Key tables are present after schema apply', () => {
        const expectedTables = [
            'User',
            'Store',
            'Product',
            'Order',
            'OrderItem',
            'RefreshToken',
            'Cart',
            'CartItem',
            'Address',
            'Notification',
            'ProcessedWebhook',
            'OrderStatusHistory',
        ];

        for (const tableName of expectedTables) {
            it(`table "${tableName}" exists`, async () => {
                const res = await pgConn.query(
                    `SELECT COUNT(*) AS cnt
                     FROM information_schema.tables
                     WHERE table_schema = 'public'
                     AND table_name = $1`,
                    [tableName]
                );
                expect(parseInt(res.rows[0].cnt, 10)).toBe(1);
            });
        }
    });

    // ─── Step 3: Verify critical columns ─────────────────────────────────────

    describe('Step 3: Critical columns exist and have correct data types', () => {
        interface ColSpec {
            table: string;
            column: string;
            type: string;
        }

        const criticalColumns: ColSpec[] = [
            { table: 'User', column: 'id', type: 'text' },
            { table: 'User', column: 'email', type: 'text' },
            { table: 'User', column: 'passwordHash', type: 'text' },
            { table: 'User', column: 'isTwoFactorEnabled', type: 'bool' },
            { table: 'RefreshToken', column: 'revoked', type: 'bool' },
            { table: 'RefreshToken', column: 'replacedBy', type: 'text' },
            { table: 'Order', column: 'status', type: 'user-defined' },
            { table: 'Order', column: 'paymentStatus', type: 'text' },
            { table: 'Order', column: 'deliveryOTP', type: 'text' },
            { table: 'Order', column: 'isOTPVerified', type: 'bool' },
            { table: 'Product', column: 'stockQuantity', type: 'int' },
            { table: 'Product', column: 'trackInventory', type: 'bool' },
            { table: 'Store', column: 'stripeAccountId', type: 'text' },
            { table: 'Store', column: 'stripeOnboardingStatus', type: 'text' },
        ];

        for (const { table, column, type } of criticalColumns) {
            it(`"${table}"."${column}" exists with type containing "${type}"`, async () => {
                const res = await pgConn.query(
                    `SELECT data_type
                     FROM information_schema.columns
                     WHERE table_schema = 'public'
                     AND table_name = $1
                     AND column_name = $2`,
                    [table, column]
                );
                expect(res.rows.length).toBe(1);
                expect(res.rows[0].data_type.toLowerCase()).toContain(type.toLowerCase());
            });
        }
    });

    // ─── Step 4: Verify indexes ───────────────────────────────────────────────

    describe('Step 4: Key indexes are present', () => {
        const expectedIndexes = [
            { table: 'RefreshToken', column: 'userId' },
            { table: 'Order', column: 'userId' },
            { table: 'Order', column: 'storeId' },
            { table: 'Product', column: 'storeId' },
        ];

        for (const { table, column } of expectedIndexes) {
            it(`index exists on "${table}"."${column}"`, async () => {
                const res = await pgConn.query(
                    `SELECT COUNT(*) AS cnt
                     FROM pg_indexes
                     WHERE schemaname = 'public'
                     AND tablename = $1
                     AND indexdef ILIKE $2`,
                    [table, `%"${column}"%`]
                );
                expect(parseInt(res.rows[0].cnt, 10)).toBeGreaterThanOrEqual(1);
            });
        }
    });

    // ─── Step 5: Raw CRUD on fresh schema ─────────────────────────────────────

    describe('Step 5: SQL operations succeed against the fresh schema', () => {
        it('creates and reads back a User record', async () => {
            const insertRes = await pgConn.query(
                `INSERT INTO "User" (id, email, "passwordHash", role, "isActive", "emailVerified", "phoneVerified",
                                    "failedLoginAttempts", "isTwoFactorEnabled", "isDriverApproved",
                                    "createdAt", "updatedAt")
                 VALUES (gen_random_uuid()::text, 'migration-test@example.com', 'dummyhash123', 'CUSTOMER', true, false, false,
                         0, false, false, NOW(), NOW())
                 RETURNING id, email`
            );

            expect(insertRes.rows.length).toBe(1);
            expect(insertRes.rows[0].email).toBe('migration-test@example.com');

            const selectRes = await pgConn.query(
                `SELECT * FROM "User" WHERE email = 'migration-test@example.com'`
            );
            expect(selectRes.rows.length).toBe(1);

            await pgConn.query(
                `DELETE FROM "User" WHERE email = 'migration-test@example.com'`
            );
        });

        it('unique constraint on User.email is enforced', async () => {
            const insertOnce = async () =>
                pgConn.query(
                    `INSERT INTO "User" (id, email, "passwordHash", role, "isActive", "emailVerified", "phoneVerified",
                                        "failedLoginAttempts", "isTwoFactorEnabled", "isDriverApproved",
                                        "createdAt", "updatedAt")
                     VALUES (gen_random_uuid()::text, 'unique-test@example.com', 'dummyhash123', 'CUSTOMER', true, false, false,
                             0, false, false, NOW(), NOW())`
                );

            await insertOnce();

            await expect(insertOnce()).rejects.toThrow(/duplicate key/);

            await pgConn.query(
                `DELETE FROM "User" WHERE email = 'unique-test@example.com'`
            );
        });
    });
});
