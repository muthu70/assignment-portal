@echo off
cd /d "%~dp0"
echo ===== Assignment Portal - SERVER =====

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo.
  echo A file called .env was created.
  echo Notepad will open. Paste your MongoDB connection string into MONGO_URI,
  echo change JWT_SECRET, then save and close Notepad.
  echo.
  pause
  notepad ".env"
  pause
)

if not exist "node_modules" (
  echo.
  echo Installing packages. This is needed only the first time and can take a few minutes.
  call npm install
)

echo.
echo Creating the admin account if it does not exist yet...
call npm run seed:admin

echo.
echo Starting the server. Keep this window open.
call npm run dev
pause
