@echo off
call env.bat
cd /d "%~dp0"
title Papeleria POS
color 0A

echo ============================================
echo  PAPELERIA POS
echo ============================================
echo.

REM Verificar si PM2 esta instalado
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [SETUP] Instalando PM2...
    call npm install -g pm2
    echo.
)

REM Verificar dependencias del backend
if not exist "backend\node_modules\.bin\tsx" (
    echo [SETUP] Instalando dependencias del backend...
    cd backend
    call npm install
    cd ..
    echo.
)

REM Verificar dependencias del frontend
if not exist "frontend\node_modules\.bin\vite" (
    echo [SETUP] Instalando dependencias del frontend...
    cd frontend
    call npm install
    cd ..
    echo.
)

REM Detener procesos previos si existen
pm2 stop pape-backend >nul 2>&1
pm2 stop pape-frontend >nul 2>&1

REM Verificar PostgreSQL
set PGPASSWORD=admin01
psql -U postgres -h localhost -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [SETUP] Iniciando PostgreSQL...
    net start postgresql-x64-18 >nul 2>&1 || net start postgresql-x64-16 >nul 2>&1 || net start postgresql >nul 2>&1
    timeout /t 3 >nul
)

REM Ejecutar migraciones
cd backend
npx prisma migrate deploy >nul 2>&1
cd ..

REM Ejecutar seed
cd backend
npx prisma db seed >nul 2>&1
cd ..

echo Iniciando backend y frontend...
pm2 start ecosystem.config.js

echo.
echo ============================================
echo  SISTEMA INICIADO
echo ============================================
echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo  Puedes CERRAR esta ventana sin problemas.
echo.
echo  Detener:   pm2 stop all
echo  Ver logs:  pm2 logs
echo  Estado:    pm2 status
echo.
