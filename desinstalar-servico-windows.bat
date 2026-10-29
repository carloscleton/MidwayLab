@echo off
title MidwayLab - Desinstalar Servico Automatico
color 0C
cd /d "%~dp0"

echo ========================================================
echo   MIDWAYLAB - REMOVER ROBO DA INICIALIZACAO AUTOMATICA
echo ========================================================
echo.
echo Removendo tarefa do agendador do Windows...
schtasks /delete /tn "MidwayAgent" /f >nul 2>&1

echo Removendo da pasta Inicializar (Startup)...
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MidwayLab_Robo.bat" >nul 2>&1
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MidwayAgent.vbs" >nul 2>&1

echo Encerrando processos ativos do robo...
powershell.exe -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*midwaylab-robo-tray*' -or $_.CommandLine -like '*agent-service*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

echo.
echo ========================================================
echo   Servico do Robo desinstalado do Windows com sucesso.
echo ========================================================
echo.
pause
