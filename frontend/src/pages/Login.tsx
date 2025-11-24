import { useEffect, useState } from "react";
import axios from "axios";
import api from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"student"|"teacher"|"admin">("student");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) navigate("/boards", { replace: true });
  }, [navigate]);

  const persistAuth = (res) => {
    localStorage.setItem("access", res.data.access);
    if (res.data.refresh) {
      localStorage.setItem("refresh", res.data.refresh);
    }
    if (res.data.role) {
      localStorage.setItem("role", res.data.role);
    }
    if (res.data.username) {
      localStorage.setItem("username", res.data.username);
    }
    if (res.data.user_id) {
      localStorage.setItem("user_id", String(res.data.user_id));
    }
    if (typeof res.data.is_admin !== "undefined") {
      localStorage.setItem("is_admin", String(Boolean(res.data.is_admin)));
    }
    if (typeof res.data.full_name !== "undefined") {
      localStorage.setItem("full_name", String(res.data.full_name || ""));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setError("");
      if (!username || !password) {
        setError("Completa usuario y contraseña");
        return;
      }
      setLoading(true);
      // Elegir endpoint según pestaña
      let res;
      if (activeTab === "admin") {
        res = await api.post("/token/", { username, password });
        const isAdmin = Boolean(res.data?.is_admin);
        if (!isAdmin) {
          setError("Este usuario no es administrador.");
          return;
        }
      } else {
        const endpoint = activeTab === "teacher" ? "/token/teacher/" : "/token/student/";
        res = await api.post(endpoint, { username, password });
      }

      persistAuth(res);
      if (activeTab === "admin" || res?.data?.is_admin) {
        navigate("/admin");
      } else {
        navigate("/boards");
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen bg-gradient">
      <div className="login-layout">
        <div className="brand">
          <h1>Kanban Académico</h1>
          <p>Organiza tus cursos, tareas y entregas en un solo lugar.</p>
        </div>
        <div className="card">
          <h1>Iniciar sesión</h1>

          {error && <div className="alert">{error}</div>}

          <p className="form-label">Selecciona tu tipo de usuario y accede</p>
          <div className="form-group">
            <div className="role-toggle" role="tablist" aria-label="Tipo de usuario">
              <button
                type="button"
                className={`role-option ${activeTab === "student" ? "active" : ""}`}
                onClick={() => setActiveTab("student")}
              >
                Estudiante
              </button>
              <button
                type="button"
                className={`role-option ${activeTab === "teacher" ? "active" : ""}`}
                onClick={() => setActiveTab("teacher")}
              >
                Catedrático
              </button>
              <button
                type="button"
                className={`role-option ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => setActiveTab("admin")}
                title="Acceso administrativo"
              >
                Administración
              </button>
            </div>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Usuario</label>
              <input
                id="username"
                className="input"
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group input-group">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-right"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
            <div className="row" style={{ marginTop: 8, justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setUsername(""); setPassword(""); setError(""); }}
                disabled={loading}
              >
                Limpiar
              </button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
