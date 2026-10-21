@echo off
title MidwayLab - Instalar Robo como Servico Automatico do Windows
color 0B

:: Entra na pasta do script
cd /d "%~dp0"

echo ========================================================
echo   MIDWAYLAB - INSTALADOR DE SERVICO WINDOWS (AUTO-START)
echo ========================================================
echo.

:: 1. Verifica se e Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Voce precisa clicar com o botao direito neste arquivo
    echo e escolher: "Executar como Administrador".
    echo.
    pause
    exit /b 1
)

echo [1/3] Verificando Node.js...
node -v >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Por favor, instale o Node.js.
    pause
    exit /b 1
)

echo [2/3] Instalando gerenciador de segundo plano (PM2)...
call npm install -g pm2 pm2-windows-service

echo [3/3] Registrando e iniciando o Robo MidwayAgent 24/7...
call pm2 start agent-service.ts --name "MidwayAgent" --interpreter "npx" --interpreter-args "ts-node"
call pm2 save

echo.
echo ========================================================
echo    SUCESSO! O ROBO MIDWAY AGORA ESTA INSTALADO!
echo    Ele vai rodar 24/7 e ligar sozinho junto com o Windows.
echo ========================================================
echo.
pause
