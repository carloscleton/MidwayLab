@echo off
title MidwayLab - Reiniciar Servico do Robo
color 0E

echo ========================================================
echo       MIDWAYLAB - REINICIAR SERVICO DO ROBO
echo ========================================================
echo.

:: 1. Finaliza os processos antigos do robô em memória
echo [1/2] Encerrando processos antigos do robo...
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*dist-agent*' -or $_.CommandLine -like '*agent-service*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

:: Finaliza qualquer instância wscript associada ao robô
taskkill /F /FI "WINDOWTITLE eq MidwayAgent*" >nul 2>&1

echo [2/2] Iniciando nova versao atualizada do Robo...
cd /d "%~dp0"
wscript.exe "%~dp0iniciar-invisivel.vbs"

echo.
echo ========================================================
echo   SUCESSO! O ROBO FOI REINICIADO COM A VERSAO ATUALIZADA!
echo   Agora todos os pedidos lidos vao direto para o Supabase!
echo ========================================================
echo.
pause
