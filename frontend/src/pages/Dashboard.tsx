// src/pages/Dashboard.jsx

import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="hero">
      <h1>Panel Principal</h1>
      <p>Accede rápidamente a tus módulos y mantén todo organizado.</p>

      <div className="actions" style={{ justifyContent: "flex-start" }}>
        <Link to="/tasks" className="action-link">Tareas</Link>
        <Link to="/courses" className="action-link">Cursos</Link>
        <Link to="/calendar" className="action-link">Calendario</Link>
      </div>
    </div>
  );
}

