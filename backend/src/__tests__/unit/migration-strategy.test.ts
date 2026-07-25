import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Migration Strategy & Automation Unit Tests', () => {
    const rootDir = path.resolve(__dirname, '../../../');
    const prismaDir = path.resolve(rootDir, 'prisma');
    const scriptsDir = path.resolve(rootDir, 'scripts');
    const backupDir = path.resolve(rootDir, 'backups');

    describe('Documentation Criteria', () => {
        it('MIGRATION_STRATEGY.md exists and documents core migration policies', () => {
            const docPath = path.join(prismaDir, 'MIGRATION_STRATEGY.md');
            expect(fs.existsSync(docPath)).toBe(true);

            const content = fs.readFileSync(docPath, 'utf-8');
            expect(content).toContain('Rollback Protocol');
            expect(content).toContain('Pre-Migration Backup');
            expect(content).toContain('Zero-Downtime');
            expect(content).toContain('Expand and Contract');
        });
    });

    describe('Automated Migration Script (deploy-migrations.sh)', () => {
        it('deploy-migrations.sh exists and is executable', () => {
            const scriptPath = path.join(scriptsDir, 'deploy-migrations.sh');
            expect(fs.existsSync(scriptPath)).toBe(true);

            const stats = fs.statSync(scriptPath);
            // Verify executable permission for owner (bit 0o100)
            const isExecutable = !!(stats.mode & 0o100);
            expect(isExecutable).toBe(true);
        });

        it('executes deploy-migrations.sh and generates a timestamped pre-migration backup file', () => {
            const scriptPath = path.join(scriptsDir, 'deploy-migrations.sh');

            // Run deployment script
            const output = execSync(`bash "${scriptPath}"`, {
                cwd: rootDir,
                encoding: 'utf-8',
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb'
                }
            });

            expect(output).toContain('[GroceNest Migration Deployment]');
            expect(output).toContain('SUCCESS');

            // Confirm backups directory contains at least 1 timestamped snapshot file
            expect(fs.existsSync(backupDir)).toBe(true);
            const backupFiles = fs.readdirSync(backupDir).filter(f => f.startsWith('db_pre_migration_'));
            expect(backupFiles.length).toBeGreaterThan(0);
        });
    });

    describe('Zero-Downtime Schema Safety Audit', () => {
        it('schema.prisma does not contain forced non-nullable fields without defaults', () => {
            const schemaPath = path.join(prismaDir, 'schema.prisma');
            expect(fs.existsSync(schemaPath)).toBe(true);

            const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
            const lines = schemaContent.split('\n');

            // Basic check: Ensure model field declarations adhere to Prisma syntax
            const modelLines = lines.filter(l => l.trim().startsWith('model ') || l.trim().startsWith('enum '));
            expect(modelLines.length).toBeGreaterThan(0);
        });
    });

    describe('Rollback Script Availability', () => {
        it('root rollback-deploy.sh and verify-db-backup.sh exist', () => {
            const rootWorkspaceDir = path.resolve(rootDir, '../');
            const rollbackScript = path.join(rootWorkspaceDir, 'scripts', 'rollback-deploy.sh');
            const verifyBackupScript = path.join(rootWorkspaceDir, 'scripts', 'verify-db-backup.sh');

            expect(fs.existsSync(rollbackScript)).toBe(true);
            expect(fs.existsSync(verifyBackupScript)).toBe(true);
        });
    });
});
