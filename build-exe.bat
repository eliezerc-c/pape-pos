@echo off
echo ============================================
echo  CONSTRUYENDO PAPELERIA POS (.EXE)
echo ============================================
echo.

cd backend
echo Instalando deps de produccion...
call npm install --production
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo instalacion backend.
    pause
    exit /b 1
)

cd ..\frontend
echo Construyendo frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo construccion frontend.
    pause
    exit /b 1
)

cd ..
echo Construyendo Electron...
call npx electron-builder --win --dir
if %ERRORLEVEL% neq 0 (
    echo Advertencia: electron-builder pudo no estar instalado globalmente.
    echo Instalando electron-builder...
    call npm install -g electron-builder
    call npx electron-builder --win --dir
)

echo.
echo ============================================
echo  .EXE GENERADO EN: dist\
echo ============================================
pause
