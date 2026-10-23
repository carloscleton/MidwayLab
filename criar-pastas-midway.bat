@echo off
title MIDWAY LAB - GERADOR OFICIAL DE PASTAS
color 0A
echo ========================================================
echo       MIDWAY LAB - GERADOR OFICIAL DE PASTAS
echo ========================================================
echo.
echo Criando a estrutura oficial de pastas em C:\MidwayLab...
echo.

if not exist "C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Entrada" mkdir "C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Entrada"
if not exist "C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Processados" mkdir "C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Processados"
if not exist "C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Erros" mkdir "C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Erros"
if not exist "C:\MidwayLab\Equipamentos\SYSMEX_UF_1500\Carga" mkdir "C:\MidwayLab\Equipamentos\SYSMEX_UF_1500\Carga"
if not exist "C:\MidwayLab\Equipamentos\SYSMEX_UF_1500\Resultados" mkdir "C:\MidwayLab\Equipamentos\SYSMEX_UF_1500\Resultados"

echo.
echo [OK] Estrutura oficial criada com sucesso em C:\MidwayLab:
echo   - C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Entrada
echo   - C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Processados
echo   - C:\MidwayLab\Labfacil\SYSMEX_UF_1500\Erros
echo   - C:\MidwayLab\Equipamentos\SYSMEX_UF_1500\Carga
echo   - C:\MidwayLab\Equipamentos\SYSMEX_UF_1500\Resultados
echo.
pause
