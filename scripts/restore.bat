@echo off
call ../env.bat
echo ============================================
echo  RESTAURAR PAPELERIA POS
echo ============================================
echo.

echo [1/4] Verificando conexión a PostgreSQL...
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: psql no encontrado en el PATH.
    echo Asegurate de tener PostgreSQL instalado y en el PATH.
    pause
    exit /b 1
)

echo [2/4] Verificando archivos de backup disponibles...
set BACKUP_DIR=database\backups
if not exist "%BACKUP_DIR%" (
    echo ERROR: Directorio de backups no encontrado: %BACKUP_DIR%
    pause
    exit /b 1
)

dir /b "%BACKUP_DIR%\*.sql" 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: No se encontraron archivos de backup en %BACKUP_DIR%
    pause
    exit /b 1
)

echo.
echo Archivos de backup disponibles:
set /a COUNT=0
for %%f in ("%BACKUP_DIR%\*.sql") do (
    set /a COUNT+=1
    echo   !COUNT!. %%~nxf
)

echo.
set /p BACKUP_FILE="Ingresa el nombre del archivo de backup (ej. backup-2024-01-15.sql): "

if not exist "%BACKUP_DIR%\%BACKUP_FILE%" (
    echo ERROR: Archivo de backup no encontrado: %BACKUP_DIR%\%BACKUP_FILE%
    pause
    exit /b 1
)

echo [3/4] Verificando que la base de datos existe...
set PGPASSWORD=admin01
psql -U postgres -h localhost -c "SELECT 1 FROM pape_pos.pg_catalog.pg_database WHERE datname = 'pape_pos'" 2>&1 >nul

if %ERRORLEVEL% neq 0 (
    echo [3/4] Creando base de datos...
    psql -U postgres -h localhost -c "CREATE DATABASE pape_pos" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo Advertencia: No se pudo crear la base de datos. Continuando con la restauracion.
    )
)

echo [4/4] Ejecutando restauracion...
echo ADVERTENCIA: Esto sobrescribira todos los datos actuales.
set /p CONFIRM="Estas seguro? (s/n): "
if /i "%CONFIRM%" neq "s" (
    echo Restauracion cancelada.
    pause
    exit /b 0
)

pg_restore -U postgres -h localhost -d pape_pos --clean --if-exists "%BACKUP_DIR%\%BACKUP_FILE%" 2>&1

if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo la restauracion.
    echo Intentando con psql directo...
    psql -U postgres -h localhost -d pape_pos -f "%BACKUP_DIR%\%BACKUP_FILE%" 2>&1
    if %ERRORLEVEL% neq 0 (
        echo ERROR: La restauracion con psql tambien fallo.
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo  RESTAURACION COMPLETADA
echo ============================================
echo Backup restaurado desde: %BACKUP_DIR%\%BACKUP_FILE%
echo.
echo Ejecuta las migraciones si es necesario:
echo   cd backend && npx prisma migrate deploy
echo.
pause
