@echo off
echo.
echo  ArcusSoft Decision OS v5
echo  ========================
echo.

IF NOT EXIST node_modules (
  echo  Installing dependencies...
  call npm install
  echo.
)

echo  Starting server on port 3000...
echo.

REM Start server in a separate window
start "Decision OS Server" node server.js

REM Wait for server to be ready
timeout /t 2 /nobreak >nul

REM Open browser
echo  Opening http://localhost:3000 ...
start http://localhost:3000

echo.
echo  Server is running. Close the server window to stop.
echo.
