@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\local\iniciar_cotizador_local.ps1" -OpenBrowser %*
