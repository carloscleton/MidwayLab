@echo off
title MidwayLab - Iniciar Robo Agente 24/7
color 0A

:: Entra na pasta onde este script esta gravado
cd /d "%~dp0"

echo ========================================================
echo       MIDWAYLAB - ROBO AGENTE DE MONITORAMENTO 24/7
echo ========================================================
echo.
echo Local da pasta: %CD%
echo Conectando ao MidwayLab e verificando pastas locais...
echo.

:: Executa o agente compilado via node diretamente
node -r ts-node/register agent-service.ts

if %errorLevel% neq 0 (
    echo.
    echo [AVISO] Tentando iniciar via npx...
    npx ts-node agent-service.ts
)

echo.
pause
