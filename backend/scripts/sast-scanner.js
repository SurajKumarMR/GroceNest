/**
 * Local SAST (Static Application Security Testing) Utility
 * Scans codebase files for OWASP Top 10 vulnerabilities, exposed secrets, and insecure patterns.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');

const SECURITY_RULES = [
    {
        id: 'SEC-001',
        name: 'Hardcoded Secret / Private Key Pattern',
        regex: /(?:secret|password|api[_-]?key|private[_-]?key)\s*[:=]\s*['"`](?!process\.env|supersecret|placeholder)[A-Za-z0-9+/=_-]{16,}['"`]/i,
        severity: 'HIGH',
    },
    {
        id: 'SEC-002',
        name: 'Unsafe Code Execution (eval / new Function)',
        regex: /\b(eval\(|new\s+Function\()/g,
        severity: 'HIGH',
    },
    {
        id: 'SEC-003',
        name: 'Raw SQL Injection Risk (String Concatenation)',
        regex: /\$queryRawUnsafe\(|\$executeRawUnsafe\(/g,
        severity: 'MEDIUM',
    },
    {
        id: 'SEC-004',
        name: 'Insecure Wildcard CORS Origin',
        regex: /cors\(\s*\{[^}]*origin\s*:\s*['"`]\*['"`]/g,
        severity: 'MEDIUM',
    },
    {
        id: 'SEC-005',
        name: 'Dangerously Set Inner HTML',
        regex: /dangerouslySetInnerHTML\s*=/g,
        severity: 'LOW',
    },
];

const IGNORE_DIRS = ['node_modules', '.git', '.next', 'coverage', 'dist', 'build', '.idea', '.vscode'];

function scanDirectory(dir, issues = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (IGNORE_DIRS.includes(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            scanDirectory(fullPath, issues);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            // Ignore test files or self-script
            if (entry.name.includes('.test.') || entry.name === 'sast-scanner.js') continue;

            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, idx) => {
                SECURITY_RULES.forEach((rule) => {
                    if (rule.regex.test(line)) {
                        issues.push({
                            ruleId: rule.id,
                            name: rule.name,
                            severity: rule.severity,
                            file: path.relative(ROOT_DIR, fullPath),
                            line: idx + 1,
                            snippet: line.trim(),
                        });
                    }
                });
            });
        }
    }
    return issues;
}

console.log('🔍 Running Local SAST Security Scan...');
const issues = scanDirectory(ROOT_DIR);

if (issues.length === 0) {
    console.log('✅ SAST Scan Passed: 0 security violations found in codebase.');
    process.exit(0);
} else {
    console.log(`⚠️  SAST Scan Findings (${issues.length} issue(s) detected):`);
    issues.forEach((issue) => {
        console.log(`  [${issue.severity}] ${issue.ruleId}: ${issue.name}`);
        console.log(`    File: ${issue.file}:${issue.line}`);
        console.log(`    Snippet: "${issue.snippet}"\n`);
    });

    const highSeverityCount = issues.filter((i) => i.severity === 'HIGH').length;
    if (highSeverityCount > 0) {
        console.error(`❌ SAST Scan Failed: ${highSeverityCount} HIGH severity issue(s) found.`);
        process.exit(1);
    } else {
        console.log('✅ SAST Scan Completed: No HIGH severity blockers.');
        process.exit(0);
    }
}
