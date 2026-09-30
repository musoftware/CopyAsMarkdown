@echo off
setlocal

echo ===================================================
echo   Copy as Markdown - Extension Installer
echo   Target: Google Antigravity IDE and VS Code
echo ===================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

set "VSIX_FILE="
for /f "delims=" %%F in ('dir /b /o-n copy-as-markdown-*.vsix 2^>nul') do (
    if not defined VSIX_FILE set "VSIX_FILE=%%F"
)

if not defined VSIX_FILE (
    echo [ERROR] No copy-as-markdown-*.vsix file found in:
    echo         %SCRIPT_DIR%
    echo [INFO]  Please run: npm run compile and npx @vscode/vsce package
    echo.
    pause
    exit /b 1
)

set "FULL_VSIX_PATH=%SCRIPT_DIR%%VSIX_FILE%"
echo [INFO] Target package: %VSIX_FILE%
echo.

set /a INSTALLED_COUNT=0

:: Antigravity detection
set "ANTIGRAVITY_BIN="
if exist "%LOCALAPPDATA%\Programs\Antigravity IDE\bin\antigravity-ide.cmd" (
    set "ANTIGRAVITY_BIN=%LOCALAPPDATA%\Programs\Antigravity IDE\bin"
) else if exist "%ProgramFiles%\Antigravity IDE\bin\antigravity-ide.cmd" (
    set "ANTIGRAVITY_BIN=%ProgramFiles%\Antigravity IDE\bin"
)

echo [CHECK] Detecting Google Antigravity IDE...
if defined ANTIGRAVITY_BIN (
    echo [INSTALL] Installing into Google Antigravity IDE...
    pushd "%ANTIGRAVITY_BIN%"
    call antigravity-ide.cmd --install-extension "%FULL_VSIX_PATH%" --force
    popd
    echo [OK] Successfully processed Google Antigravity IDE.
    set /a INSTALLED_COUNT+=1
) else (
    echo [SKIP] Google Antigravity IDE not detected on this system.
)
echo.

:: VS Code detection
set "VSCODE_BIN="
if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd" (
    set "VSCODE_BIN=%LOCALAPPDATA%\Programs\Microsoft VS Code\bin"
) else if exist "%ProgramFiles%\Microsoft VS Code\bin\code.cmd" (
    set "VSCODE_BIN=%ProgramFiles%\Microsoft VS Code\bin"
) else if exist "%ProgramFiles(x86)%\Microsoft VS Code\bin\code.cmd" (
    set "VSCODE_BIN=%ProgramFiles(x86)%\Microsoft VS Code\bin"
)

echo [CHECK] Detecting Visual Studio Code...
if defined VSCODE_BIN (
    echo [INSTALL] Installing into Visual Studio Code...
    pushd "%VSCODE_BIN%"
    call code.cmd --install-extension "%FULL_VSIX_PATH%" --force
    popd
    echo [OK] Successfully processed Visual Studio Code.
    set /a INSTALLED_COUNT+=1
) else (
    echo [SKIP] Visual Studio Code not detected on this system.
)
echo.

echo ===================================================
echo [SUCCESS] Process finished.
echo Please restart or reload your editor to activate the extension.
echo ===================================================
echo.

pause
