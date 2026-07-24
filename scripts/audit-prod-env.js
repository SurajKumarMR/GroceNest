const fs = require('fs');
const path = require('path');

console.log('=========================================');
console.log('  Production Environment Variable Audit  ');
console.log('=========================================');

const issues = [];
const warnings = [];

// Helper to check env content
function auditEnvFile(filePath, isProdTarget = false) {
    if (!fs.existsSync(filePath)) {
        if (isProdTarget) {
            issues.push(`[CRITICAL] Production config file '${filePath}' does not exist.`);
        } else {
            console.log(`[INFO] Skipping optional file '${filePath}' (not found).`);
        }
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const envVars = {};

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valParts] = trimmed.split('=');
            envVars[key.trim()] = valParts.join('=').trim();
        }
    });

    console.log(`[INFO] Auditing ${filePath} (${Object.keys(envVars).length} variables found)...`);

    // Rule 1: NODE_ENV check
    if (envVars['NODE_ENV'] && envVars['NODE_ENV'] !== 'production' && isProdTarget) {
        issues.push(`[${filePath}] NODE_ENV is set to '${envVars['NODE_ENV']}', must be 'production'.`);
    }

    // Rule 2: JWT_SECRET strength
    if (envVars['JWT_SECRET']) {
        const secret = envVars['JWT_SECRET'];
        if (secret.length < 32) {
            issues.push(`[${filePath}] JWT_SECRET length is ${secret.length} chars (must be >= 32 chars).`);
        }
        if (['secret', 'secret123', 'default_secret', 'changeme', 'your_secure_random_jwt_secret_here'].includes(secret.toLowerCase())) {
            issues.push(`[${filePath}] JWT_SECRET is using a weak default placeholder value: '${secret}'.`);
        }
    }

    // Rule 3: ENCRYPTION_KEY length
    if (envVars['ENCRYPTION_KEY']) {
        const key = envVars['ENCRYPTION_KEY'];
        if (key.length !== 32 && key.length !== 64) {
            issues.push(`[${filePath}] ENCRYPTION_KEY length is ${key.length} chars (must be exactly 32 bytes / 64 hex chars).`);
        }
    }

    // Rule 4: Leaked Dev/Test URLs & Keys in Production Target
    if (isProdTarget) {
        Object.entries(envVars).forEach(([key, value]) => {
            if (value.includes('localhost') || value.includes('127.0.0.1')) {
                issues.push(`[${filePath}] Production variable '${key}' contains local loopback address: '${value}'.`);
            }
            if (value.includes('sk_test_') || value.includes('pk_test_')) {
                issues.push(`[${filePath}] Production variable '${key}' is using a Stripe test mode key: '${value}'.`);
            }
        });
    } else {
        // Warning mode for dev/example configs
        Object.entries(envVars).forEach(([key, value]) => {
            if (value.includes('sk_test_')) {
                warnings.push(`[${filePath}] Variable '${key}' is using test mode key in development config.`);
            }
        });
    }
}

// Audit standard dev/example files
auditEnvFile(path.join(__dirname, '../backend/.env'), false);
auditEnvFile(path.join(__dirname, '../backend/.env.example'), false);
auditEnvFile(path.join(__dirname, '../web/.env.example'), false);

// Audit production files
auditEnvFile(path.join(__dirname, '../backend/.env.production'), true);
auditEnvFile(path.join(__dirname, '../web/.env.production'), true);

console.log('\n--- AUDIT SUMMARY ---');
if (issues.length === 0) {
    console.log('✓ Zero critical environment variable vulnerabilities found.');
} else {
    console.error(`❌ Found ${issues.length} critical env issues:`);
    issues.forEach(i => console.error(`  - ${i}`));
}

if (warnings.length > 0) {
    console.log(`\n⚠ Found ${warnings.length} configuration warnings:`);
    warnings.forEach(w => console.log(`  - ${w}`));
}

console.log('=========================================');
if (issues.length > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
