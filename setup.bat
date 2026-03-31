@echo off
echo Installing dependencies...
py -m venv venv
venv\Scripts\pip.exe install -r requirements.txt
venv\Scripts\pip.exe install pytest
echo.
echo Setup complete! Run run.bat to start the pipeline.
pause
