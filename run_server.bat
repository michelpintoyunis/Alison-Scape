@echo off
echo Iniciando servidor local para evitar errores de CORS con las imagenes...
echo Abre tu navegador y ve a: http://localhost:8000
python -m http.server 8000
pause
