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

echo  Starting server...
echo.
node server.js
pause
