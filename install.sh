#!/usr/bin/env bash

set -e

echo "==================================================="
echo "  Copy as Markdown - Extension Installer"
echo "  Target: Google Antigravity IDE and VS Code"
echo "==================================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Locate the latest VSIX package
VSIX_FILE="$(ls -1t copy-as-markdown-*.vsix 2>/dev/null | head -n 1 || true)"

if [ -z "$VSIX_FILE" ]; then
    echo "[ERROR] No copy-as-markdown-*.vsix file found in:"
    echo "        $SCRIPT_DIR"
    echo "[INFO]  Please run: npm run compile && npx @vscode/vsce package"
    echo ""
    exit 1
fi

FULL_VSIX_PATH="$SCRIPT_DIR/$VSIX_FILE"
echo "[INFO] Target package: $VSIX_FILE"
echo ""

INSTALLED_COUNT=0

# 2. Detect and install into Google Antigravity IDE
echo "[CHECK] Detecting Google Antigravity IDE..."
ANTIGRAVITY_BIN=""

if command -v antigravity-ide >/dev/null 2>&1; then
    ANTIGRAVITY_BIN="$(command -v antigravity-ide)"
elif command -v antigravity >/dev/null 2>&1; then
    ANTIGRAVITY_BIN="$(command -v antigravity)"
elif [ -x "/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide" ]; then
    ANTIGRAVITY_BIN="/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide"
elif [ -x "$HOME/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide" ]; then
    ANTIGRAVITY_BIN="$HOME/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide"
fi

if [ -n "$ANTIGRAVITY_BIN" ]; then
    echo "[INSTALL] Installing into Google Antigravity IDE..."
    "$ANTIGRAVITY_BIN" --install-extension "$FULL_VSIX_PATH" --force
    echo "[OK] Successfully installed in Google Antigravity IDE."
    INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
else
    echo "[SKIP] Google Antigravity IDE was not detected on this system."
fi
echo ""

# 3. Detect and install into Visual Studio Code
echo "[CHECK] Detecting Visual Studio Code..."
VSCODE_BIN=""

if command -v code >/dev/null 2>&1; then
    VSCODE_BIN="$(command -v code)"
elif [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
    VSCODE_BIN="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
elif [ -x "$HOME/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
    VSCODE_BIN="$HOME/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
elif [ -x "/usr/share/code/bin/code" ]; then
    VSCODE_BIN="/usr/share/code/bin/code"
elif [ -x "/snap/bin/code" ]; then
    VSCODE_BIN="/snap/bin/code"
fi

if [ -n "$VSCODE_BIN" ]; then
    echo "[INSTALL] Installing into Visual Studio Code..."
    "$VSCODE_BIN" --install-extension "$FULL_VSIX_PATH" --force
    echo "[OK] Successfully installed in Visual Studio Code."
    INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
else
    echo "[SKIP] Visual Studio Code was not detected on this system."
fi
echo ""

# 4. Summary
echo "==================================================="
if [ "$INSTALLED_COUNT" -gt 0 ]; then
    echo "[SUCCESS] Installation finished ($INSTALLED_COUNT editor(s) updated)."
    echo "Please restart or reload your editor to activate changes."
else
    echo "[WARN] No supported editors were detected."
    echo "You can manually install $VSIX_FILE via the Extensions view."
fi
echo "==================================================="
echo ""
