#!/bin/bash
set -e

echo "=== GroceNest Dockerfile Verification Script ==="

# Check backend compilation first
echo "[1/4] Verifying backend TypeScript compilation..."
(cd backend && npm run build)

# Validate Dockerfile presence
echo "[2/4] Checking Dockerfile existence across services..."
test -f backend/Dockerfile && echo "✓ backend/Dockerfile present"
test -f web/Dockerfile && echo "✓ web/Dockerfile present"
test -f mobile/Dockerfile && echo "✓ mobile/Dockerfile present"

# Validate .dockerignore presence
echo "[3/4] Checking .dockerignore files..."
test -f backend/.dockerignore && echo "✓ backend/.dockerignore present"
test -f web/.dockerignore && echo "✓ web/.dockerignore present"
test -f mobile/.dockerignore && echo "✓ mobile/.dockerignore present"

# Optional Docker CLI build check if Docker daemon is running
echo "[4/4] Checking Docker CLI availability..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "Docker daemon active. Building optimized backend container..."
    docker build -t grocenest-backend-test ./backend
    echo "✓ Backend container build verified successfully!"
else
    echo "Docker daemon not running in current environment; skipped daemon build step."
fi

echo "=== All Dockerfile Verification Steps Completed Successfully! ==="
