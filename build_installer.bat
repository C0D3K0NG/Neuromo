@echo off
echo ===================================================
echo     NEUROMO BUILD SCRIPT (Windows)
echo ===================================================

echo [1/3] Checking dependencies...
pip install pyinstaller

echo [2/3] Cleaning previous builds...
rmdir /s /q build
rmdir /s /q dist

echo [3/3] Building EXE with PyInstaller...
pyinstaller neuromo.spec

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build FAILED! Check the logs above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo ✅ BUILD SUCCESSFUL!
echo ===================================================
echo.
echo The executable is located at: dist\Neuromo\Neuromo.exe
echo.
echo NEXT STEPS to create INSTALLER:
echo 1. Download & Install "Inno Setup" from jrsoftware.org
echo 2. Right-click "setup.iss" -> "Open with Inno Setup Compiler"
echo 3. Click "Build" -> "Compile" (or press F9)
echo 4. Your "Neuromo_Installer.exe" will appear in the "Output" folder.
echo.
pause
