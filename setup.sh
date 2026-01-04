#!/bin/bash
# v86 XP Setup Script
# Downloads required binaries for the XP VM

set -e

echo "=== v86 XP VM Setup ==="
echo ""

# Check for required tools
command -v curl >/dev/null 2>&1 || { echo "curl required but not installed."; exit 1; }

# v86 release URL (update version as needed)
V86_VERSION="latest"
V86_BASE="https://github.com/copy/v86/releases/download/${V86_VERSION}"

# Download v86 files
echo "[1/4] Downloading v86.wasm..."
if [ ! -f "v86.wasm" ]; then
    curl -L -o v86.wasm "https://copy.sh/v86/build/v86.wasm" || echo "  Manual download required from https://github.com/copy/v86"
fi

echo "[2/4] Downloading libv86.js..."
if [ ! -f "libv86.js" ]; then
    curl -L -o libv86.js "https://copy.sh/v86/build/libv86.js" || echo "  Manual download required"
fi

echo "[3/4] Downloading BIOS files..."
if [ ! -f "seabios.bin" ]; then
    curl -L -o seabios.bin "https://copy.sh/v86/bios/seabios.bin" || echo "  Manual download required"
fi
if [ ! -f "vgabios.bin" ]; then
    curl -L -o vgabios.bin "https://copy.sh/v86/bios/vgabios.bin" || echo "  Manual download required"
fi

echo "[4/4] XP Image..."
if [ ! -f "xp.img" ]; then
    echo "  XP image not found. Download manually:"
    echo "  - TinyXP: https://archive.org/search?query=tinyxp"
    echo "  - MicroXP: https://archive.org/search?query=microxp"
    echo "  Rename to 'xp.img' and place in this directory."
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Files present:"
ls -lh *.wasm *.js *.bin *.img 2>/dev/null || echo "  (some files missing)"
echo ""
echo "Next steps:"
echo "1. Add XP image as 'xp.img'"
echo "2. Run: python3 -m http.server 8080"
echo "3. Open: http://localhost:8080"
