# Run backend with Google OAuth from FE .env
# Usage: .\run.ps1

$feEnv = Join-Path '..' 'FE\.env'
if (Test-Path $feEnv) {
  $line = (Select-String -Path $feEnv -Pattern '^VITE_GOOGLE_CLIENT_ID=' | Select-Object -First 1)
  if ($line) {
    $env:GOOGLE_CLIENT_ID = $line.Line.Split('=',2)[1].Trim()
    Write-Host "[OK] GOOGLE_CLIENT_ID loaded from FE/.env"
  }
}
mvn -DskipTests spring-boot:run
