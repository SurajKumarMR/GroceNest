#!/bin/bash
# GroceNest Backend Setup Script
# Run: bash setup-backend.sh

set -e

echo "=== Starting GroceNest Backend ==="
cd /home/suraj/App-GroceNest/backend

echo "--- Checking SQLite database ---"
if [ -f "prisma/dev.db" ]; then
    size=$(du -h prisma/dev.db | cut -f1)
    echo "SQLite DB found: $size"
else
    echo "SQLite DB not found, running migrations..."
    npx prisma migrate deploy
fi

echo ""
echo "--- Generating Prisma client ---"
npx prisma generate

echo ""
echo "--- Starting backend server on port 8000 ---"
npm run dev
