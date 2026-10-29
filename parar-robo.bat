@echo off
title MidwayLab - Parar Robo
color 0C
cd /d "%~dp0"

echo Encerrando processos do Robo MidwayLab...
powershell.exe -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*midwaylab-robo-tray*' -or $_.CommandLine -like '*agent-service*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1
echo.
echo [OK] Robo parado com sucesso.
timeout /t 3 >nul
