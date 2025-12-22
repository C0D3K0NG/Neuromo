@echo off
echo Installing PyInstaller...
pip install pyinstaller

echo.
echo Building Neuromo Executable...
echo This may take a minute.
echo.

pyinstaller --name Neuromo --add-data "pages;pages" --add-data "static;static" --add-data "face_landmarker.task;." --onefile app.py

echo.
echo Build Complete!
echo You can find your app in the "dist" folder.
pause
