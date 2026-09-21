@echo off
echo ============================================
echo  SETUP PAPELERIA POS - WINDOWS
echo ============================================
echo.

REM Verificar que psql esta disponible
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: psql no encontrado en el PATH.
    echo Instala PostgreSQL y agrega al PATH o edita este archivo.
    pause
    exit /b 1
)

echo [1/6] Creando base de datos pape_pos...
psql -U postgres -c "DROP DATABASE IF EXISTS pape_pos;" 2>nul
psql -U postgres -c "CREATE DATABASE pape_pos;" 2>nul
if %ERRORLEVEL% neq 0 (
    echo Intentando con contrasena...
    set /p PG_PASS="Contrasena de postgres: "
    PGPASSWORD=%PG_PASS% psql -U postgres -c "CREATE DATABASE pape_pos;" 2>nul
)
echo OK: Base de datos creada.

echo.
echo [2/6] Instalando dependencias del backend...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo la instalacion del backend.
    pause
    exit /b 1
)
echo OK: Backend instalado.

echo.
echo [3/6] Ejecutando migraciones de Prisma...
cd src
call npx prisma migrate dev --name init
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo la migracion.
    pause
    exit /b 1
)
echo OK: Migraciones ejecutadas.

echo.
echo [4/6] Ejecutando seed con datos demo...
call npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo Advertencia: El seed fallo (puede ser la primera vez).
)
echo OK: Datos demo cargados.

cd ..\..

echo.
echo [5/6] Instalando dependencias del frontend...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo la instalacion del frontend.
    pause
    exit /b 1
)
echo OK: Frontend instalado.

cd ..

echo.
echo [6/6] Creando archivo .env...
if not exist ".env" (
    copy .env.example .env >nul
)
echo OK: Archivo .env listo.

echo.
echo ============================================
echo  SETUP COMPLETADO
echo ============================================
echo.
echo Para iniciar el sistema:
echo   1. Ejecutar: cd backend && npm run dev
echo   2. Ejecutar: cd frontend && npm run dev
echo.
echo Para generar .exe:
echo   Ejecutar: build-exe.bat
echo.
echo Accede a: http://localhost:5173
echo.
pause
