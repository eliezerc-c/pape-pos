@echo off
call env.bat
title CONFIGURAR SERVICIOS - Papeleria POS
echo ============================================
echo  CONFIGURAR SERVICIOS AUTOMATICOS
echo ============================================
echo.

REM ============================================================
REM PASO 1: Verificar PostgreSQL
REM ============================================================
echo [1/3] Verificando PostgreSQL...
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] psql no encontrado. PostgreSQL no esta instalado.
    pause
    exit /b 1
)
echo OK: PostgreSQL encontrado.

REM ============================================================
REM PASO 2: Configurar PostgreSQL como servicio auto-inicio
REM ============================================================
echo [2/3] Configurando PostgreSQL auto-inicio...
sc config postgresql-x64-18 start= auto >nul 2>&1
if %ERRORLEVEL% neq 0 (
    sc config postgresql-x64-16 start= auto >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        sc config postgresql start= auto >nul 2>&1
        if %ERRORLEVEL% neq 0 (
            echo [WARN] No se pudo configurar el servicio automaticamente.
            echo Ejecuta como Administrador: sc config postgresql-x64-18 start= auto
        )
    )
)
if %ERRORLEVEL% equ 0 echo OK: Servicio PostgreSQL configurado como automatico.

REM Asegurar que PostgreSQL este corriendo ahora
echo Iniciando PostgreSQL...
net start postgresql-x64-18 >nul 2>&1 || net start postgresql-x64-16 >nul 2>&1 || net start postgresql >nul 2>&1
timeout /t 3 >nul

REM ============================================================
REM PASO 3: Instalar proyecto como tarea de inicio Windows
REM ============================================================
echo [3/3] Instalando Papeleria POS como tarea de inicio...

schtasks /Delete /TN "PapeleriaPOS-Backend" /F >nul 2>&1
schtasks /Create /TN "PapeleriaPOS-Backend" /TR "pm2 start ecosystem.config.js" /SC ONSTART /RU SYSTEM /RL HIGHEST /F >nul 2>&1

if %ERRORLEVEL% equ 0 (
    echo OK: Servicio instalado. Se iniciara con Windows.
) else (
    echo [WARN] No se pudo instalar la tarea programada.
    echo Ejecuta como Administrador para habilitar inicio automatico.
)

echo.
echo ============================================
echo  CONFIGURACION COMPLETADA
echo ============================================
echo.
echo  PostgreSQL:    Auto-inicio con Windows (servicio)
echo  Proyecto:      Auto-inicio con Windows (tarea programada)
echo.
echo  Para iniciar manualmente:
echo    start.bat
echo.
echo  Para restaurar datos de prueba:
echo    scripts\seed.bat
echo.
pause
