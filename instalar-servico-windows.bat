@echo off
title MidwayLab - Configurar Inicializacao Automatica com o Windows
color 0B

cd /d "%~dp0"

echo ========================================================
echo   MIDWAYLAB AGENT - INICIALIZADOR AUTOMATICO WINDOWS
echo ========================================================
echo.

:: 1. Cria a tarefa no Agendador de Tarefas do Windows Nativo (sem depender de pm2)
echo [1/2] Registrando o Robo no Windows para ligar no logon...
schtasks /create /tn "MidwayAgent" /tr "wscript.exe \"%~dp0iniciar-invisivel.vbs\"" /sc onlogon /rl highest /f >nul 2>&1

if %errorLevel% neq 0 (
    :: Se falhar permissao de schtasks, adiciona na pasta Inicializar do usuario atual
    echo [Fallback] Adicionando na pasta de Inicializacao do Usuario...
    copy /y "%~dp0iniciar-invisivel.vbs" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MidwayAgent.vbs" >nul
)

echo [2/2] Iniciando o Robo Midway agora em segundo plano...
wscript.exe "%~dp0iniciar-invisivel.vbs"

echo.
echo ========================================================
echo   SUCESSO! O ROBO MIDWAY AGORA ESTA 100%% AUTOMATICO!
echo.
echo   * Ele ja esta rodando agora mesmo em segundo plano.
echo   * Toda vez que o computador ligar, ele inicia sozinho.
echo   * Nao precisa abrir site, nem digitar comandos.
echo ========================================================
echo.
pause
