# Kanban Académico

Aplicación completa con Django REST Framework (backend) + React Vite (frontend). Incluye módulo de administración (gestión de usuarios) y autenticación JWT.

## Requisitos
- Python 3.10+
- Node.js 18+
- Windows PowerShell (para scripts .ps1) o equivalente

## Arranque rápido (Windows)
1) Preparar entorno y deps:
```
cd kanban-academico\scripts\windows
.\setup.ps1
```
2) Ejecutar ambos servidores (backend y frontend) en ventanas separadas:
```
.\start.ps1
```

- Backend: http://127.0.0.1:8000
- Frontend: http://127.0.0.1:5173

Usuarios demo creados por `setup.ps1`:
- admin1 / Admin123!  (staff/superuser, rol catedrático)
- teacher1 / Teacher123!
- student1 / Student123!

## Arranque manual
### Backend
```
cd backend
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py create_demo_users  # opcional
python manage.py runserver 127.0.0.1:8000
```

### Frontend
```
cd frontend
npm install
npm run dev
```

## Notas
- El frontend usa proxy de Vite a `/api` → `127.0.0.1:8000`, por lo que no deberías tener CORS en desarrollo.
- Pantalla de login: pestañas “Acceso” y “Administración”. La pestaña de administración tiene login propio y muestra el panel si `is_staff = true`.
