@echo off
echo ============================================
echo  INICIANDO PAPELERIA POS
echo ============================================
echo.

REM Verificar si PM2 esta instalado
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Instalando PM2...
    npm install -g pm2
)

echo Iniciando backend y frontend en segundo plano...
pm2 start ecosystem.config.js

echo.
echo ============================================
echo  SISTEMA INICIADO
echo ============================================
echo.
echo  Backend API:  http://localhost:3001
echo  Frontend Web: http://localhost:5173
echo.
echo  Para ver estado: pm2 status
echo  Para detener:    pm2 stop all
echo  Para eliminar:   pm2 delete all
echo  Para ver logs:   pm2 logs
echo.
pm2 status
pause
