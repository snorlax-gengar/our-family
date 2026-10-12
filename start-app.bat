@echo off
chcp 65001 >nul
echo ===================================================
echo   [내집마련 플래너] 서버를 시작합니다...
echo   접속 주소: http://localhost:5001
echo ===================================================

cd /d "%~dp0\backend"
start http://localhost:5001
node server.js
pause
