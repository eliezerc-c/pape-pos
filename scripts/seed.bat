@echo off
echo ============================================
echo  SEED DATOS - PAPELERIA POS
echo ============================================
echo.

cd backend

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
npx prisma db pull --force --schema=./prisma/schema.prisma >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Advertencia: No se pudo conectar a la base de datos.
    echo Verifica que PostgreSQL este corriendo y DATABASE_URL este correcta.
)

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
npx prisma query --schema=./prisma/schema.prisma "SELECT username, roleId FROM users" >nul 2>&1

echo.
echo Productos en la base de datos:
npx prisma query --schema=./prisma/schema.prisma "SELECT COUNT(*) FROM products" >nul 2>&1

cd ..
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
