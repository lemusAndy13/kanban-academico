Param()

Write-Host "== Kanban Académico: Setup (Windows) ==" -ForegroundColor Cyan

Push-Location $PSScriptRoot\..\..

# Backend
Set-Location backend
if (!(Test-Path ".venv")) {
  py -m venv .venv
}
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py create_demo_users
deactivate

# Frontend
Set-Location ..\frontend
npm install

Pop-Location

Write-Host "Listo. Ejecuta scripts\windows\start.ps1 para arrancar backend y frontend." -ForegroundColor Green


