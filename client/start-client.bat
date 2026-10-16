@echo off
cd /d "%~dp0"
echo ===== Assignment Portal - WEBSITE =====

if not exist "node_modules" (
  echo Installing packages. This is needed only the first time and can take a few minutes.
  call npm install
)

echo.
echo Starting the website. Keep this window open.
echo When it is ready, open http://localhost:5173 in your browser.
call npm run dev
pause
