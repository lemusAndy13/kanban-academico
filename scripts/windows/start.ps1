Param()

Write-Host "== Kanban Académico: Start (Windows) ==" -ForegroundColor Cyan

Push-Location $PSScriptRoot\..\..

# Backend
Start-Process -NoNewWindow -FilePath "pwsh" -ArgumentList "-NoLogo","-NoProfile","-Command","cd backend; . .\.venv\Scripts\Activate.ps1; python manage.py runserver 127.0.0.1:8000" | Out-Null

# Frontend
Start-Process -NoNewWindow -FilePath "pwsh" -ArgumentList "-NoLogo","-NoProfile","-Command","cd frontend; npm run dev" | Out-Null

Pop-Location

Write-Host "Servidores iniciados (backend y frontend)."
Write-Host "Backend:   http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Frontend:  http://127.0.0.1:5173" -ForegroundColor Yellow


