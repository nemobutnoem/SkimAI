@echo off
REM Run backend with environment variables from .env
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        set "%%A=%%B"
    )
)
for /f "tokens=2 delims==" %%i in ('findstr /i "VITE_GOOGLE_CLIENT_ID" ..\FE\.env') do set "GOOGLE_CLIENT_ID=%%i"
mvn -DskipTests spring-boot:run
