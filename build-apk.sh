#!/bin/bash
# GroceNest APK Build Script
# Run after setup-backend.sh: bash build-apk.sh

set -e

echo "=== Building GroceNest Release APK ==="
cd /home/suraj/App-GroceNest/mobile

echo "--- Current API URL ---"
cat .env

echo ""
echo "--- Cleaning build cache ---"
# Skipping interactive clean
# npx react-native clean 2>/dev/null || true

echo ""
echo "--- Re-installing dependencies ---"
npm install

echo ""
echo "--- Gradle clean ---"
cd android && ./gradlew clean && cd ..

echo ""
echo "--- Building release APK ---"
cd android && ./gradlew assembleRelease 2>&1 | tail -30

echo ""
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    size=$(du -h "$APK_PATH" | cut -f1)
    echo "=== APK BUILD SUCCESS ==="
    echo "Location: $(pwd)/$APK_PATH"
    echo "Size: $size"
    echo ""
    echo "Install with: adb install -r $(pwd)/$APK_PATH"
else
    echo "=== APK BUILD FAILED - check errors above ==="
    exit 1
fi
