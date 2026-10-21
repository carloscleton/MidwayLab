@echo off
title MidwayLab - Instalador do Servico Windows
echo ====================================================
echo   MIDWAYLAB AGENT - INSTALADOR DE SERVICO WINDOWS
echo ====================================================
echo.

:: Verifica permissao de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Este instalador precisa ser executado como ADMINISTRADOR.
    echo Clique com o botao direito no arquivo e escolha "Executar como Administrador".
    pause
    exit /b 1
)

echo [1/3] Verificando ambiente Node.js...
node -v >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale o Node.js antes de continuar.
    pause
    exit /b 1
)

echo [2/3] Instalando gerenciador de servico pm2 (caso nao exista)...
call npm install -g pm2 pm2-windows-service

echo [3/3] Registrando e iniciando o Robo Midway Agent 24/7...
call npx ts-node agent-service.ts

echo.
echo ====================================================
echo   ROBO MIDWAY AGENT INSTALADO COM SUCESSO!
echo ====================================================
echo.
pause
