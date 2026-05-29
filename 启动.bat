@echo off
title 中国经济数据可视化平台

echo ============================================
echo    Chinese Economic Data Visualization
echo ============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org
    pause
    exit /b 1
)

echo [Node.js] OK
echo.

if not exist "node_modules" (
    echo [Install] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
) else (
    echo [Deps] OK
)

echo.
echo [Start] Launching...
start "" http://localhost:5173 2>nul
call npm run dev
pause
