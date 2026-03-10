@echo off
title Servidor do App de Ingles
echo ==========================================
echo Iniciando o ambiente do App de Ingles...
echo ==========================================

:: 1. Entrando na pasta do projeto
cd /d "c:\Users\lsant\.gemini\antigravity\playground\iridescent-schrodinger"

:: 2. Configura o Node.js no Path da mesma sessão do bat
set "PATH=C:\Program Files\nodejs;%PATH%"

:: 3. Inicia o servidor de desenvolvimento do Vite mantendo a janela aberta para ver erros (/k)
start "Vite Server" cmd /k "npm run dev"

:: 4. Aguarda 4 segundos para dar tempo do servidor subir
timeout /t 4 /nobreak >nul

:: 4. Abre o navegador automaticamente na porta padrao do Vite
start http://localhost:5173

exit
