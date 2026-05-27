@echo off
REM Run backend with Google OAuth from FE .env
REM Usage: run.bat

for /f "tokens=2 delims==" %%i in ('findstr /i "VITE_GOOGLE_CLIENT_ID" ..\FE\.env') do set "GOOGLE_CLIENT_ID=%%i"
mvn -DskipTests spring-boot:run
