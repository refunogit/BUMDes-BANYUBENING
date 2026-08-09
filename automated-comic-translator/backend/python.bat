@echo off
setlocal
if not exist "%~dp0.venv\Scripts\python.exe" (
  echo ERROR: backend\.venv belum ada. Jalankan install.bat terlebih dahulu.
  exit /b 1
)
"%~dp0.venv\Scripts\python.exe" %*
