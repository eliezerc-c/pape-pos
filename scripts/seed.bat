@echo off
call ../env.bat
cd /d "%~dp0"
cd ..
cd backend

echo ============================================
echo  SEED DATOS - PAPELERIA POS
echo ============================================
echo.

if not exist "node_modules" (
    echo Instalando dependencias del backend...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
)

echo [1/3] Verificando conexion a la base de datos...
psql -U postgres -h localhost -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se puede conectar a PostgreSQL.
    echo Asegurate de que PostgreSQL este corriendo.
    echo Ejecuta: start.bat
    pause
    exit /b 1
)
echo OK: Conexion a PostgreSQL establecida.

echo.
echo [2/3] Ejecutando seed...
echo Datos que se crearan:
echo   - Usuario ADMIN: admin / admin123
echo   - Usuario CAJERO: cajero / cajero123
echo   - 2 roles con permisos
echo   - 11 categorias
echo   - 8 marcas
echo   - 12 productos
echo.

npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo el seed.
    echo Verifica que la base de datos este accesible.
    pause
    exit /b 1
)

echo OK: Datos de seed cargados exitosamente.

echo.
echo [3/3] Verificando datos...
echo Usuarios en la base de datos:
npx prisma query --schema=./prisma/schema.prisma "SELECT username, roleId FROM users" 2>&1

echo.
echo Productos en la base de datos:
npx prisma query --schema=./prisma/schema.prisma "SELECT COUNT(*) FROM products" 2>&1

cd ..\..
echo.
echo ============================================
echo  SEED COMPLETADO
echo ============================================
echo.
echo Credenciales de acceso:
echo   ADMIN: admin / admin123
echo   CAJERO: cajero / cajero123
echo.
pause
