#!/bin/bash

# StealthInterview Desktop Build Script
# This script builds the Electron app for Windows and Mac

set -e

echo "🛡️ StealthInterview Desktop Builder"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the /app/desktop directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Create placeholder icons if they don't exist
if [ ! -f "assets/icon.png" ]; then
    echo "🎨 Creating placeholder icons..."
    
    # Convert SVG to PNG using ImageMagick (if available) or create a simple placeholder
    if command -v convert &> /dev/null; then
        convert -background none -resize 512x512 assets/icon.svg assets/icon.png
        convert -background none -resize 256x256 assets/icon.svg assets/icon-256.png
        convert -background none -resize 16x16 assets/icon.svg assets/tray-icon.png
    else
        echo "⚠️ ImageMagick not found. Please manually create icon.png (512x512)"
    fi
fi

# Build for specified platform
case "$1" in
    "win"|"windows")
        echo "🪟 Building for Windows..."
        yarn build:win
        ;;
    "mac"|"macos")
        echo "🍎 Building for macOS..."
        yarn build:mac
        ;;
    "linux")
        echo "🐧 Building for Linux..."
        yarn build:linux
        ;;
    "all")
        echo "🌍 Building for all platforms..."
        yarn build:all
        ;;
    *)
        echo "Usage: ./build.sh [win|mac|linux|all]"
        echo ""
        echo "Examples:"
        echo "  ./build.sh win    # Build Windows installer"
        echo "  ./build.sh mac    # Build macOS DMG"
        echo "  ./build.sh all    # Build for all platforms"
        exit 1
        ;;
esac

echo ""
echo "✅ Build complete! Check the dist/ folder for output files."
echo ""
ls -la dist/ 2>/dev/null || echo "No dist folder found yet."
