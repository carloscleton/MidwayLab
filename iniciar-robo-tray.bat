@echo off
title MidwayLab - Agente de Bandeja
cd /d "%~dp0"

:: Executa o script PowerShell em segundo plano e adiciona o icone perto do relogio
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0midwaylab-robo-tray.ps1"
exit
