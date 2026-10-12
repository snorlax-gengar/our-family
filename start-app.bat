@echo off
chcp 65001 >nul
echo ===================================================
echo   [우리가 (우리家)] 우리 가족 보금자리 플래너를 시작합니다...
echo   접속 주소: http://localhost:5001
echo ===================================================

cd /d "%~dp0\backend"
start http://localhost:5001
node server.js
pause
