# Kanban Académico - Scaffold

Este es un scaffold mínimo (backend Django + frontend React + Vite) para arrancar el proyecto del Kanban Académico.

## Backend
```
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Frontend
```
cd frontend
npm install
npm run dev
```

Frontend corre en http://localhost:5173
API corre en http://127.0.0.1:8000/api/
