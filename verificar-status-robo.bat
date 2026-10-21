@echo off
title MidwayLab - Status do Robo Agente
color 0E

echo ========================================================
echo         MIDWAYLAB - VERIFICADOR DE STATUS DO ROBO
echo ========================================================
echo.

:: 1. Verifica no Agendador de Tarefas do Windows
echo [1] Verificando servico automatico no Windows...
schtasks /query /tn "MidwayAgent" >nul 2>&1
if %errorLevel% equ 0 (
    echo     [OK] Servico 'MidwayAgent' esta REGISTRADO no Windows!
) else (
    echo     [AVISO] Servico automatico nao encontrado.
)
echo.

:: 2. Verifica se o processo Node do robo esta rodando agora na memoria
echo [2] Verificando se o Robo esta RODANDO na memoria do computador...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*dist-agent*' -or $_.CommandLine -like '*agent-service*' } | Select-Object ProcessId, CommandLine" > "%TEMP%\midway_check.tmp" 2>&1

findstr /i "agent-service" "%TEMP%\midway_check.tmp" >nul 2>&1
if %errorLevel% equ 0 (
    color 0A
    echo     ========================================================
    echo     🟢 O ROBO MIDWAY ESTA ATIVO E RODANDO AGORA MESMO!
    echo     ========================================================
) else (
    color 0C
    echo     ========================================================
    echo     ⚪ O ROBO NAO ESTA RODANDO NO MOMENTO.
    echo     ========================================================
)

if exist "%TEMP%\midway_check.tmp" del "%TEMP%\midway_check.tmp"

echo.
echo ========================================================
echo Opcoes rapidas:
echo   [1] Iniciar Robo Agora em Segundo Plano
echo   [2] Parar Robo
echo   [3] Sair
echo ========================================================
set /p opt="Escolha uma opcao (1-3): "

if "%opt%"=="1" (
    wscript.exe "%~dp0iniciar-invisivel.vbs"
    echo.
    echo [OK] Robo iniciado com sucesso em segundo plano!
    pause
    exit /b 0
)

if "%opt%"=="2" (
    powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*agent-service*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
    echo.
    echo [OK] Robo finalizado!
    pause
    exit /b 0
)
