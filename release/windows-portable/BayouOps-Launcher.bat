@echo off
setlocal
title BayouOps Suite Pro Launcher

set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%BayouOps-Launcher.ps1"

endlocal
