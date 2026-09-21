@echo off
echo ============================================
echo  BACKUP PAPELERIA POS
echo ============================================
echo.

set BACKUP_DIR=database\backups
set TIMESTAMP=%DATE:~-4,4%-%DATE:~-10,2%-%DATE:~-7,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup-%TIMESTAMP%.sql

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [1/3] Verificando conexión a PostgreSQL...
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: psql no encontrado en el PATH.
    echo Asegurate de tener PostgreSQL instalado y en el PATH.
    pause
    exit /b 1
)

echo [2/3] Ejecutando backup de la base de datos...
set PGPASSWORD=admin01
pg_dump -U postgres -h localhost -d pape_pos -F c -f "%BACKUP_FILE%" 2>&1

if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo el backup de la base de datos.
    echo Verifica la conexión y los permisos.
    pause
    exit /b 1
)

echo OK: Backup creado en %BACKUP_FILE%
echo Tamano del archivo:
powershell -Command "(Get-Item '%BACKUP_FILE%').Length / 1MB" 2>nul

echo [3/3] Limpiando backups antiguos (mantener ultimos 7)...
powershell -Command "Get-ChildItem '%BACKUP_DIR%\*.sql' | Sort-Object LastWriteTime | Select-Object -Skip 7 | Remove-Item -Force" 2>nul

echo.
echo ============================================
echo  BACKUP COMPLETADO
echo ============================================
echo Archivo: %BACKUP_FILE%
echo.
pause
