@echo off
chcp 65001 >nul
title ChamikoFiles - Package for Deployment
cd /d "%~dp0"

set DEPLOY_DIR=%~dp0deploy
set ZIP_NAME=chamiko-files-deploy.zip

echo.
echo ============================================
echo   ChamikoFiles - Packaging for Deployment
echo ============================================
echo.

:: Step 1: Build
echo [1/4] Building project...
call npm run build
if %errorLevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Build done.

:: Step 2: Clean and create deploy directory
echo.
echo [2/4] Preparing deploy directory...
if exist "%DEPLOY_DIR%" rd /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"

:: Step 3: Copy files
echo.
echo [3/4] Copying files...

:: Copy standalone (the actual app)
xcopy ".next\standalone\*" "%DEPLOY_DIR%\" /E /I /Y /Q >nul

:: Copy static assets (required by Next.js standalone)
xcopy ".next\static" "%DEPLOY_DIR%\.next\static" /E /I /Y /Q >nul

:: Copy public folder (favicon etc.)
if exist "public" xcopy "public" "%DEPLOY_DIR%\public" /E /I /Y /Q >nul

:: Remove config.ini — excluded via outputFileTracingExcludes, fallback delete here
if exist "%DEPLOY_DIR%\config.ini" (
    del "%DEPLOY_DIR%\config.ini" /Q >nul
    echo [INFO] Fallback: removed config.ini from deploy
)

:: Remove data folder — runtime will create it on first run, excluded via outputFileTracingExcludes
if exist "%DEPLOY_DIR%\data" (
    rd /s /q "%DEPLOY_DIR%\data" 2>nul
    echo [INFO] Fallback: removed data/ from deploy
)

:: Clean up unnecessary files in deploy
if exist "%DEPLOY_DIR%\node_modules\@types" rd /s /q "%DEPLOY_DIR%\node_modules\@types" 2>nul
if exist "%DEPLOY_DIR%\node_modules\@next\swc-win32-ia32-msvc" rd /s /q "%DEPLOY_DIR%\node_modules\@next\swc-win32-ia32-msvc" 2>nul
if exist "%DEPLOY_DIR%\node_modules\@next\swc-darwin-x64" rd /s /q "%DEPLOY_DIR%\node_modules\@next\swc-darwin-x64" 2>nul
if exist "%DEPLOY_DIR%\node_modules\@next\swc-darwin-arm64" rd /s /q "%DEPLOY_DIR%\node_modules\@next\swc-darwin-arm64" 2>nul
if exist "%DEPLOY_DIR%\node_modules\@next\swc-linux-x64-gnu" rd /s /q "%DEPLOY_DIR%\node_modules\@next\swc-linux-x64-gnu" 2>nul
if exist "%DEPLOY_DIR%\node_modules\@next\swc-linux-x64-musl" rd /s /q "%DEPLOY_DIR%\node_modules\@next\swc-linux-x64-musl" 2>nul
if exist "%DEPLOY_DIR%\node_modules\@next\swc-linux-arm64-gnu" rd /s /q "%DEPLOY_DIR%\node_modules\@next\swc-linux-arm64-gnu" 2>nul
if exist "%DEPLOY_DIR%\node_modules\@next\swc-linux-arm64-musl" rd /s /q "%DEPLOY_DIR%\node_modules\@next\swc-linux-arm64-musl" 2>nul

echo [OK] Files copied.

:: Step 4: Calculate size
echo.
echo [4/4] Calculating size...
for /f "tokens=3" %%a in ('dir "%DEPLOY_DIR%" /s /-c ^| find "File(s)"') do set SIZE=%%a
set /a SIZE_MB=%SIZE% / 1048576
echo [OK] Deploy package size: ~%SIZE_MB% MB

echo.
echo ============================================
echo   Deploy package ready at:
echo   %DEPLOY_DIR%
echo.
echo   To run on target machine:
echo   cd deploy ^&^& node server.js
echo ============================================
echo.

pause
