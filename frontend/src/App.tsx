import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="app">
      <header style={{ padding: 12, borderBottom: "1px solid #eee" }}>
        <Link to="/boards">Boards</Link> | <Link to="/">Login</Link> | <Link to="/tasks">Tareas</Link>
      </header>

      <main style={{ padding: 12 }}>
        <Outlet />
      </main>
    </div>
  );
}
