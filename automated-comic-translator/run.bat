@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND_DIR=%ROOT%\backend"
set "EXTENSION_DIR=%ROOT%\extension"
set "CHECK_PY=%ROOT%\scripts\check_python.py"
set "MODE=run"

if "%~1"=="--watch" set "MODE=watch"
if "%~1"=="--build-only" set "MODE=build-only"
if "%~1"=="-h" goto :help
if "%~1"=="--help" goto :help

if not exist "%EXTENSION_DIR%\node_modules" (
  echo ERROR: extension dependencies missing. Run install.bat first.
  pause
  exit /b 1
)
if not exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
  echo ERROR: backend environment missing. Run install.bat first.
  pause
  exit /b 1
)
"%BACKEND_DIR%\.venv\Scripts\python.exe" "%CHECK_PY%" >nul 2>nul
if errorlevel 1 (
  echo ERROR: backend\.venv uses an unsupported Python version. Run install.bat again.
  pause
  exit /b 1
)

echo.
echo ==^> Building extension...
pushd "%EXTENSION_DIR%"
call npm run build
if errorlevel 1 (
  popd
  pause
  exit /b 1
)
popd

if "%MODE%"=="build-only" (
  echo.
  echo Extension built at %EXTENSION_DIR%\dist
  pause
  exit /b 0
)

if "%MODE%"=="watch" (
  echo.
  echo ==^> Starting extension watch mode in a separate window...
  start "ACT Watch" cmd /k "cd /d \"%EXTENSION_DIR%\" && npm run dev"
)

set "HOST=0.0.0.0"
set "PORT=8000"
if exist "%BACKEND_DIR%\.env" (
  for /f "tokens=2 delims==" %%a in ('findstr /b /c:"HOST=" "%BACKEND_DIR%\.env"') do set "HOST=%%a"
  for /f "tokens=2 delims==" %%a in ('findstr /b /c:"PORT=" "%BACKEND_DIR%\.env"') do set "PORT=%%a"
)

echo.
echo ==^> Starting backend on http://%HOST%:%PORT%
pushd "%BACKEND_DIR%"
"%BACKEND_DIR%\.venv\Scripts\python.exe" -m uvicorn app.main:app --host %HOST% --port %PORT%
set "EXITCODE=%ERRORLEVEL%"
popd
pause
exit /b %EXITCODE%

:help
echo Usage: run.bat [--watch ^| --build-only]
pause
exit /b 0
