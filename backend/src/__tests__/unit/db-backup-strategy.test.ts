import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Database Backup Strategy & Recovery Unit Tests', () => {
    const rootDir = path.resolve(__dirname, '../../../');
    const prismaDir = path.resolve(rootDir, 'prisma');
    const scriptsDir = path.resolve(rootDir, 'scripts');
    const dailyBackupDir = path.resolve(rootDir, 'backups/daily');

    describe('Acceptance Criteria 1: Documentation & Strategy', () => {
        it('BACKUP_STRATEGY.md exists and documents daily cron, retention, weekly restore & alerts', () => {
            const docPath = path.join(prismaDir, 'BACKUP_STRATEGY.md');
            expect(fs.existsSync(docPath)).toBe(true);

            const content = fs.readFileSync(docPath, 'utf-8');
            expect(content).toContain('Automated Daily Backups');
            expect(content).toContain('Secure Storage');
            expect(content).toContain('Weekly Automated Restore Testing');
            expect(content).toContain('Failure Alerting');
            expect(content).toContain('chmod 600');
        });
    });

    describe('Acceptance Criteria 2: Daily Automated Backups & Safe Storage (chmod 600)', () => {
        it('daily-db-backup.sh exists, is executable, and creates compressed backup with 600 permissions', () => {
            const scriptPath = path.join(scriptsDir, 'daily-db-backup.sh');
            expect(fs.existsSync(scriptPath)).toBe(true);

            const stats = fs.statSync(scriptPath);
            const isExecutable = !!(stats.mode & 0o100);
            expect(isExecutable).toBe(true);

            // Execute daily backup script
            const output = execSync(`bash "${scriptPath}"`, {
                cwd: rootDir,
                encoding: 'utf-8',
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb'
                }
            });

            expect(output).toContain('[GroceNest Daily Backup]');
            expect(output).toContain('SUCCESS');

            // Verify created backup file in backups/daily/
            expect(fs.existsSync(dailyBackupDir)).toBe(true);
            const files = fs.readdirSync(dailyBackupDir).filter(f => f.endsWith('.sql.gz'));
            expect(files.length).toBeGreaterThan(0);

            // Check file permissions (chmod 600 => owner read/write only)
            const latestFile = path.join(dailyBackupDir, files.sort().pop()!);
            const fileStats = fs.statSync(latestFile);
            const mode = fileStats.mode & 0o777;
            expect(mode).toBe(0o600);
        });

        it('retention logic prunes backup files older than retention policy', () => {
            // Create a fake old backup file modified 35 days ago
            const oldFile = path.join(dailyBackupDir, 'db_daily_20200101_000000.sql.gz');
            fs.writeFileSync(oldFile, 'fake old backup content');

            const now = Date.now();
            const thirtyFiveDaysAgo = (now - 35 * 24 * 60 * 60 * 1000) / 1000;
            fs.utimesSync(oldFile, thirtyFiveDaysAgo, thirtyFiveDaysAgo);

            expect(fs.existsSync(oldFile)).toBe(true);

            // Execute daily backup script with 30-day retention
            const scriptPath = path.join(scriptsDir, 'daily-db-backup.sh');
            execSync(`bash "${scriptPath}"`, {
                cwd: rootDir,
                encoding: 'utf-8',
                env: { ...process.env, BACKUP_RETENTION_DAYS: '30' }
            });

            // Verify old file was pruned
            expect(fs.existsSync(oldFile)).toBe(false);
        });
    });

    describe('Acceptance Criteria 3: Weekly Restore Verification', () => {
        it('verify-weekly-restore.sh exists, is executable, and passes restore verification', () => {
            const scriptPath = path.join(scriptsDir, 'verify-weekly-restore.sh');
            expect(fs.existsSync(scriptPath)).toBe(true);

            const stats = fs.statSync(scriptPath);
            const isExecutable = !!(stats.mode & 0o100);
            expect(isExecutable).toBe(true);

            // Execute weekly restore runner
            const output = execSync(`bash "${scriptPath}"`, {
                cwd: rootDir,
                encoding: 'utf-8',
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb'
                }
            });

            expect(output).toContain('[GroceNest Weekly Restore Verify]');
            expect(output).toContain('SUCCESS: Backup is 100% restorable');
        });
    });

    describe('Acceptance Criteria 4: Failure Alerting', () => {
        it('daily-db-backup.sh contains alert dispatch handler', () => {
            const scriptPath = path.join(scriptsDir, 'daily-db-backup.sh');
            const content = fs.readFileSync(scriptPath, 'utf-8');
            expect(content).toContain('send_alert');
            expect(content).toContain('BACKUP_ALERT_WEBHOOK_URL');
        });

        it('verify-weekly-restore.sh contains alert dispatch handler', () => {
            const scriptPath = path.join(scriptsDir, 'verify-weekly-restore.sh');
            const content = fs.readFileSync(scriptPath, 'utf-8');
            expect(content).toContain('send_alert');
            expect(content).toContain('BACKUP_ALERT_WEBHOOK_URL');
        });
    });
});
