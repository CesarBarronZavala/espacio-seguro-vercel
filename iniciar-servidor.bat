@echo off
title Espacio Seguro - Servidor Local
echo =======================================================
echo   Espacio Seguro - Iniciando servidor web local
echo =======================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
pause
