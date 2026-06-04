@echo off
echo =========================================
echo  Iniciando Entorno de Renderizado GLSL
echo =========================================

:: Iniciar Vite en segundo plano usando start
echo [1] Levantando servidor Vite en el puerto 3000...
start "Vite Server" cmd /c "npm run dev"

:: Iniciar servidor puente de Node para escuchar a la UI
echo [2] Levantando puente de conexión para MP4 en puerto 3001...
start "MP4 Bridge Server" cmd /c "node local-server.js"

echo.
echo =========================================
echo  Servidores Activos.
echo  Puedes entrar a http://localhost:3000
echo  y usar el boton "Exportar a MP4" 
echo  para renderizar videos.
echo =========================================
pause
