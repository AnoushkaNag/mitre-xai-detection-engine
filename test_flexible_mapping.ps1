Write-Host "Testing flexible column mapping..." -ForegroundColor Cyan

$file = "test_flexible_columns.csv"

if (-not (Test-Path $file)) {
    Write-Host "Test file not found" -ForegroundColor Red
    exit 1
}

Write-Host "Test file found" -ForegroundColor Green

try {
    $fileBytes = [System.IO.File]::ReadAllBytes($file)
    $form = @{file=@{value=$fileBytes;filename="test_flexible_columns.csv"}}
    
    Write-Host "Uploading to backend..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri "http://localhost:8001/analyze" -Method POST -Form $form -UseBasicParsing
    
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "Status: $($json.status)" -ForegroundColor Green
    Write-Host "Alerts: $($json.total)" -ForegroundColor Green
    
    if ($json.warnings) {
        Write-Host "Warnings:" -ForegroundColor Yellow
        $json.warnings | ForEach-Object { Write-Host "  $_" }
    }
    
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
