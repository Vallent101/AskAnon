@echo off
echo Starting AskAnon server...
echo.
echo Choose your method:
echo 1. Python (if installed)
echo 2. Node.js http-server (if installed)
echo 3. PHP (if installed)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo Starting Python server...
    python server.py
) else if "%choice%"=="2" (
    echo Starting Node.js server...
    npx --yes http-server -p 8000 -o
) else if "%choice%"=="3" (
    echo Starting PHP server...
    php -S localhost:8000
) else (
    echo Invalid choice. Opening index.html directly...
    start index.html
)

pause
