@echo off
echo ============================================
echo  DETENIENDO PAPELERIA POS
echo ============================================
echo.

pm2 stop all
pm2 delete all

echo.
echo Sistema detenido.
pause
