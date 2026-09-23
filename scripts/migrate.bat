@echo off
call ../env.bat
echo ============================================
echo  MIGRACIONES PRISMA - PAPELERIA POS
echo ============================================
echo.

cd backend

if not exist "node_modules" (
    echo [1/3] Instalando dependencias del backend...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
    echo OK: Dependencias instaladas.
) else (
    echo [1/3] Dependencias ya instaladas.
)

echo.
echo [2/3] Verificando estado de Prisma...
npx prisma migrate status
if %ERRORLEVEL% neq 0 (
    echo Advertencia: Problema al verificar estado de migraciones.
)

echo.
echo [3/3] Ejecutando migraciones...
npx prisma migrate deploy
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo la ejecucion de migraciones.
    pause
    exit /b 1
)

echo.
echo [OPCIONAL] Ejecutando seed con datos demo...
echo.
set /p DO_SEED="Deseas ejecutar el seed? (s/n): "
if /i "%DO_SEED%"=="s" (
    npx prisma db seed
    if %ERRORLEVEL% neq 0 (
        echo Advertencia: El seed fallo.
    ) else (
        echo OK: Seed ejecutado correctamente.
    )
)

cd ..
echo.
echo ============================================
echo  MIGRACIONES COMPLETADAS
echo ============================================
echo.
pause
