import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function App() {
  const isAuthenticated = Boolean(localStorage.getItem("access"));
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const isAdmin = localStorage.getItem("is_admin") === "true";
  const username = localStorage.getItem("username");
  const fullName = localStorage.getItem("full_name") || "";
  const roleLabel = isAdmin ? "Administrador" : (role === "teacher" ? "Catedrático" : "Estudiante");
  const themeStored = (typeof window !== "undefined" && localStorage.getItem("theme")) || "light";
  if (typeof document !== "undefined") {
    document.body.classList.toggle("dark", themeStored === "dark");
  }
  const toggleTheme = () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    document.body.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/", { replace: true });
  };
  return (
    <div className="app">
      {isAuthenticated && (
        <header className="header">
          <div className="nav">
            <strong className="brand-title">Kanban Académico</strong>
            <NavLink className={({isActive})=>`nav-link ${isActive?'active':''}`} to="/boards">Panel</NavLink>
            <NavLink className={({isActive})=>`nav-link ${isActive?'active':''}`} to="/tasks">Tareas</NavLink>
            <NavLink className={({isActive})=>`nav-link ${isActive?'active':''}`} to="/courses">Cursos</NavLink>
            <NavLink className={({isActive})=>`nav-link ${isActive?'active':''}`} to="/calendar">Calendario</NavLink>
            {isAdmin && <NavLink className={({isActive})=>`nav-link ${isActive?'active':''}`} to="/admin">Administración</NavLink>}
          </div>
          <div className="nav">
            <span className="user-badge">
              {fullName || username || "Usuario"} ({roleLabel})
            </span>
            <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">🌓</button>
            <button className="btn btn-ghost" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </header>
      )}

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
