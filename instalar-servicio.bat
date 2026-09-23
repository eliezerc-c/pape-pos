@echo off
call env.bat
cd /d "%~dp0"
title Instalar Papeleria POS como Servicio Windows
echo ============================================
echo  INSTALAR COMO SERVICIO WINDOWS
echo ============================================
echo.

REM Verificar PM2
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PM2 no encontrado. Ejecuta start.bat primero.
    pause
    exit /b 1
)

REM Instalar proceso en PM2
echo [1/2] Iniciando procesos con PM2...
pm2 start ecosystem.config.js
pm2 save

REM Crear tarea programada que se ejecute al iniciar Windows
echo [2/2] Creando tarea programada...
schtasks /Delete /TN "PapeleriaPOS" /F >nul 2>&1
schtasks /Create /TN "PapeleriaPOS" /TR "pm2 resurrect" /SC ONSTART /RU SYSTEM /RL HIGHEST /F >nul 2>&1

if %ERRORLEVEL% equ 0 (
    echo.
    echo ============================================
    echo  SERVICIO INSTALADO CORRECTAMENTE
    echo ============================================
    echo.
    echo  El proyecto iniciara automaticamente al encender Windows.
    echo.
    echo  Comandos utiles:
    echo    pm2 status       - Ver estado
    echo    pm2 logs         - Ver logs
    echo    pm2 stop all     - Detener servicios
    echo    pm2 start all    - Iniciar servicios
    echo.
    echo  Para DESINSTALAR el servicio:
    echo    schtasks /Delete /TN "PapeleriaPOS" /F
    echo    pm2 delete all
    echo.
) else (
    echo [ERROR] No se pudo crear la tarea. Intenta como Administrador.
)
pause
