@echo off
call env.bat
echo ============================================
echo  DETENIENDO PAPELERIA POS
echo ============================================
echo.

echo [1/3] Deteniendo backend y frontend...
pm2 stop pape-backend >nul 2>&1
pm2 stop pape-frontend >nul 2>&1
echo OK: Servicios detenidos.

echo.
echo [2/3] Deteniendo tarea de inicio automatico...
schtasks /Delete /TN "PapeleriaPOS-Backend" /F >nul 2>&1
echo OK: Tarea programada eliminada.

echo.
echo [3/3] PostgreSQL NO se detuvo (se mantiene activo).
echo.
echo Sistema detenido. PostgreSQL sigue corriendo.
echo Para volver a iniciar: start.bat
echo.
pause
