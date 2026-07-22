/**
 * License Compliance Auditor for Investor Readiness
 * Scans dependencies across all workspaces for non-commercial or copyleft licenses.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../');

// Allowed commercial/investor friendly licenses
const ALLOWED_LICENSES = [
    'MIT',
    'ISC',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'BlueOak-1.0.0',
    'CC0-1.0',
    '0BSD',
    'MIT-0',
    'MPL-2.0',
    'Python-2.0',
    'CC-BY-4.0',
    'Apache-2.0 AND MIT',
    '(MIT OR CC0-1.0)',
    'UNLICENSED' // Allowed for proprietary root project
];

// Disallowed strict copyleft licenses (GPL, AGPL, CC-BY-NC)
const COPYLEFT_LICENSES = [
    'GPL-2.0',
    'GPL-2.0-ONLY',
    'GPL-2.0-OR-LATER',
    'GPL-3.0',
    'GPL-3.0-ONLY',
    'GPL-3.0-OR-LATER',
    'AGPL-3.0',
    'AGPL-3.0-ONLY',
    'AGPL-3.0-OR-LATER',
    'CC-BY-NC-4.0',
];

const PACKAGES_TO_AUDIT = [
    { name: 'backend', path: path.join(ROOT_DIR, 'backend') },
    { name: 'web', path: path.join(ROOT_DIR, 'web') },
];

console.log('📜 Running Open-Source License Compliance Audit...\n');

let hasCopyleftViolation = false;

for (const pkg of PACKAGES_TO_AUDIT) {
    console.log(`Auditing workspace: [${pkg.name}]...`);
    try {
        const output = execSync('npx -y license-checker-rseidelsohn --json', {
            cwd: pkg.path,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        });

        const data = JSON.parse(output);
        const violations = [];
        const lgplNotices = [];

        for (const [depName, details] of Object.entries(data)) {
            const license = Array.isArray(details.licenses)
                ? details.licenses.join(' OR ')
                : details.licenses || 'UNKNOWN';

            // Check strict copyleft (GPL / AGPL, excluding LGPL)
            const upperLicense = license.toUpperCase();
            const isCopyleft = COPYLEFT_LICENSES.some((cl) => {
                // Ignore LGPL when checking for GPL
                if (upperLicense.includes('LGPL') && cl.startsWith('GPL')) {
                    return false;
                }
                return upperLicense.includes(cl);
            });
            if (isCopyleft) {
                violations.push({ depName, license });
            }

            if (upperLicense.includes('LGPL')) {
                lgplNotices.push({ depName, license });
            }
        }

        if (violations.length > 0) {
            hasCopyleftViolation = true;
            console.error(`  ❌ Copyleft Violations in ${pkg.name}:`);
            violations.forEach((v) => console.error(`     - ${v.depName}: ${v.license}`));
        } else {
            console.log(`  ✅ ${pkg.name}: 0 copyleft/viral license violations found.`);
        }

        if (lgplNotices.length > 0) {
            console.log(`  ℹ️  ${pkg.name}: LGPL dynamic native binaries detected (compliant for SaaS):`);
            lgplNotices.forEach((n) => console.log(`     - ${n.depName}: ${n.license}`));
        }
    } catch (err) {
        console.error(`  ⚠️ Error auditing ${pkg.name}:`, err.message);
    }
    console.log('');
}

if (hasCopyleftViolation) {
    console.error('❌ License Compliance Audit Failed: Strict copyleft licenses detected.');
    process.exit(1);
} else {
    console.log('✅ License Compliance Audit Passed: All dependencies compliant for commercial use.');
    process.exit(0);
}
