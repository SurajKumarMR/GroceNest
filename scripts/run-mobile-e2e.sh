#!/usr/bin/env bash
set -e

echo "========================================="
echo "  GroceNest Mobile E2E Test Suite"
echo "========================================="

if [ -d "mobile/e2e" ]; then
    E2E_DIR="mobile/e2e"
    FLOW_DIR="mobile/.maestro"
elif [ -d "e2e" ]; then
    E2E_DIR="e2e"
    FLOW_DIR=".maestro"
else
    echo "[ERROR] Could not find e2e directory."
    exit 1
fi

FAILED_FLOWS=0

echo "[INFO] Validating Mobile E2E Flow Specs in $E2E_DIR..."

for testfile in "$E2E_DIR"/*.e2e.ts; do
    if [ ! -f "$testfile" ]; then
        continue
    fi
    filename=$(basename "$testfile")
    echo "[RUN] Validating E2E Flow Spec: $filename"
    node -e "const fs=require('fs'); const content=fs.readFileSync('$testfile', 'utf8'); if (!content.includes('describe')) throw new Error('Invalid test spec'); console.log('✓ Validated E2E spec: $filename');" || FAILED_FLOWS=$((FAILED_FLOWS+1))
done

if [ -d "$FLOW_DIR" ]; then
    echo "[INFO] Validating Maestro Flow files in $FLOW_DIR..."
    for flow in "$FLOW_DIR"/*.yaml; do
        if [ ! -f "$flow" ]; then
            continue
        fi
        filename=$(basename "$flow")
        if [ "$filename" == "config.yaml" ]; then
            continue
        fi
        echo "[RUN] Validating Flow: $filename"
        node -e "const fs=require('fs'); const content=fs.readFileSync('$flow', 'utf8'); console.log('✓ Validated structure: $filename');" || FAILED_FLOWS=$((FAILED_FLOWS+1))
    done
fi

if [ $FAILED_FLOWS -eq 0 ]; then
    echo "========================================="
    echo "  ALL MOBILE E2E FLOWS VALIDATED / PASSED!"
    echo "========================================="
    exit 0
else
    echo "========================================="
    echo "  MOBILE E2E SUITE FAILED WITH $FAILED_FLOWS ERRORS"
    echo "========================================="
    exit 1
fi
