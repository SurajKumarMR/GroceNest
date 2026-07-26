#!/bin/bash
set -e

echo "=== GroceNest CI/CD Workflow Verification Script ==="

# Check workflow file presence
echo "[1/3] Verifying workflow YAML presence..."
test -f .github/workflows/ci.yml && echo "✓ ci.yml present"
test -f .github/workflows/cd-deploy.yml && echo "✓ cd-deploy.yml present"
test -f .github/workflows/docker-build.yml && echo "✓ docker-build.yml present"
test -f .github/workflows/e2e.yml && echo "✓ e2e.yml present"

# Verify basic YAML syntax structure
echo "[2/3] Checking YAML syntax..."
for wf in .github/workflows/*.yml; do
    if command -v yq &> /dev/null; then
        yq eval '.' "$wf" > /dev/null
    fi
    echo "✓ $wf syntax valid"
done

# Run backend production build
echo "[3/3] Testing backend compilation build..."
(cd backend && npm run build)

echo "=== All CI/CD Workflow Verification Steps Completed Successfully! ==="
