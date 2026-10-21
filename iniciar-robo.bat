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
echo Conectando ao MidwayLab e iniciando varredura...
echo.

node dist-agent\agent-service.js

echo.
pause
