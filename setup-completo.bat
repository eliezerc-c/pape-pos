@echo off
call env.bat
cd /d "%~dp0"
title SETUP COMPLETO - Papeleria POS
echo ============================================
echo  CONFIGURACION COMPLETA DEL SISTEMA
echo ============================================
echo.

REM ============================================================
REM PASO 1: Verificar que PostgreSQL este corriendo
REM ============================================================
echo [1/5] Verificando PostgreSQL...
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] psql no encontrado. PostgreSQL no esta instalado.
    echo Descargalo desde: https://www.postgresql.org/download/windows/
    echo O ejecuta: scripts\install-postgres.bat
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] node no encontrado. Node.js no esta instalado.
    echo Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)
echo OK: PostgreSQL y Node.js encontrados.

echo.
echo [2/5] Instalando dependencias del backend...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la instalacion de dependencias.
    cd ..
    pause
    exit /b 1
)
echo OK: Dependencias instaladas.
cd ..

echo.
echo [3/5] Verificando base de datos...
set PGPASSWORD=admin01
psql -U postgres -h localhost -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARN] PostgreSQL no responde en localhost:5432
    echo Intentando iniciar el servicio...
    net start postgresql-x64-18 >nul 2>&1 || net start postgresql-x64-16 >nul 2>&1 || net start postgresql >nul 2>&1
    timeout /t 3 >nul
    psql -U postgres -h localhost -c "SELECT 1" >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] No se pudo conectar a PostgreSQL.
        pause
        exit /b 1
    )
    echo OK: PostgreSQL iniciado.
) else (
    echo OK: PostgreSQL ya esta corriendo.
)

psql -U postgres -h localhost -c "SELECT 1 FROM pg_database WHERE datname = 'pape_pos'" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Creando base de datos pape_pos...
    psql -U postgres -h localhost -c "CREATE DATABASE pape_pos" 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] No se pudo crear la base de datos.
        pause
        exit /b 1
    )
    echo OK: Base de datos creada.
) else (
    echo OK: Base de datos ya existe.
)

echo [4/5] Creando y ejecutando migraciones...
cd backend
npx prisma migrate dev --name init
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Las migraciones fallaron.
    cd ..
    pause
    exit /b 1
)
cd ..
echo OK: Migraciones creadas y aplicadas.

REM ============================================================
REM PASO 5: Ejecutar seed (datos de prueba)
REM ============================================================
echo [5/5] Ejecutando seed con datos de prueba...
cd backend
npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo [WARN] El seed fallo, pero el sistema deberia funcionar.
) else (
    echo OK: Datos de prueba cargados.
)
cd ..

echo.
REM ============================================================
REM BONUS: Crear archivo .env en backend si no existe
REM ============================================================
echo [BONUS] Verificando archivo .env...
if not exist "backend\.env" (
    copy ".env" "backend\.env" >nul
    echo OK: Archivo .env creado.
) else (
    echo OK: Archivo .env ya existe.
)

echo.
echo ============================================
echo  SETUP COMPLETADO
echo ============================================
echo.
echo  Base de datos: pape_pos
echo  Datos de prueba: admin / admin123, cajero / cajero123
echo.
echo  Para iniciar el proyecto:
echo    start.bat
echo.
echo  Para instalar como servicio Windows:
echo    configurar-servicios.bat (como Administrador)
echo.
echo  Backups disponibles en: database\backups\
echo.
pause
