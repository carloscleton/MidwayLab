@echo off
title MidwayLab - Status do Robo
chcp 65001 >nul
cd /d "%~dp0"
cls

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0verificar-status.ps1"

echo ========================================================
echo   OPCOES RAPIDAS:
echo   [1] Iniciar o Robo Agora na Bandeja (relogio)
echo   [2] Parar o Robo
echo   [3] Abrir Pasta C:\MidwayLab
echo   [4] Sair
echo ========================================================
echo.
set /p opt="Escolha uma opcao (1-4): "

if "%opt%"=="1" (
  start "" powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0midwaylab-robo-tray.ps1"
  echo.
  echo [OK] Robo iniciado com sucesso! Verifique o icone junto ao relogio.
  timeout /t 3 >nul
  exit /b 0
)
if "%opt%"=="2" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*midwaylab-robo-tray*' -or $_.CommandLine -like '*agent-service*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
  echo.
  echo [OK] Robo finalizado.
  timeout /t 3 >nul
  exit /b 0
)
if "%opt%"=="3" (
  start explorer "C:\MidwayLab"
  exit /b 0
)
