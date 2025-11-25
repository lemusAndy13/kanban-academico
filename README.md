# Kanban Académico

Aplicación tipo Trello para gestión académica (cursos, listas y tareas) — React + Django REST Framework.

## Requisitos
- Node 18+ y npm
- Python 3.10+ (desarrollo usa SQLite por defecto)

## Estructura
```
kanban-academico/
  backend/     # Django + DRF
  frontend/    # React + Vite + TypeScript
```

## Backend (Django)
1) Crear y activar entorno:
```
cd backend
py -3 -m venv .venv
. .venv/Scripts/Activate.ps1
pip install --upgrade pip --disable-pip-version-check
pip install -r requirements.txt --disable-pip-version-check
```
2) Migraciones y ejecutar:
```
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
3) Endpoints principales
- Auth:
  - POST `/api/auth/register/`
  - POST `/api/auth/login/`
  - POST `/api/auth/refresh/`
  - GET/PATCH `/api/me/`
- Boards:
  - GET `/api/boards/`
  - POST `/api/boards/{id}/lists/`
  - GET `/api/boards/{id}/activity/`
- Cards:
  - GET `/api/cards/search/?q=&label=&assignee=&due_before=&due_after=`
  - POST `/api/cards/{id}/assignees/`
  - POST `/api/cards/{id}/labels/`
- Archivos:
  - POST `/api/attachments/` (file/url), POST `/api/attachments/{id}/grade/`
- Documentación:
  - OpenAPI: `/api/schema/`
  - Swagger UI: `/api/docs/`

Variables de entorno recomendadas (opcional):
```
ADMIN_USERNAME=admin1
DJANGO_SECRET_KEY=dev-secret-key
```

## Frontend (React)
1) Ejecutar:
```
cd frontend
npm i
npm run dev
```
2) La app usa proxy de Vite a `http://127.0.0.1:8000/api`.

## Pruebas
- Frontend:
```
cd frontend
npm run test:run
```
- Backend:
```
cd backend
python manage.py test
```

## CI (GitHub Actions)
Se incluye workflow en `.github/workflows/ci.yml` que ejecuta:
- Tests de backend con `manage.py test`
- Tests de frontend con `vitest`

## Notas
- En desarrollo se usa SQLite; para producción se sugiere Postgres.
- Subida de archivos local mediante `MEDIA_ROOT`/`MEDIA_URL`.

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
