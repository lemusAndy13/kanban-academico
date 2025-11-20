import { useEffect, useState } from "react";
import axios from "axios";
import api from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";
import AdminPage from "./Admin";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student"|"teacher">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login"|"admin">("login");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    const isStaff = localStorage.getItem("is_staff") === "true";
    if (token && !isStaff) {
      navigate("/boards", { replace: true });
    }
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
    if (typeof res.data.is_staff !== "undefined") {
      localStorage.setItem("is_staff", String(Boolean(res.data.is_staff)));
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
      const endpoint = role === "teacher"
        ? "/token/teacher/"
        : "/token/student/";
      const res = await api.post(endpoint, {
        username,
        password,
      });

      persistAuth(res);

      navigate("/boards");
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setError("");
      if (!username || !password) {
        setError("Completa usuario y contraseña");
        return;
      }
      setLoading(true);
      const endpoint = "/token/"; // login general que incluye is_staff
      const res = await api.post(endpoint, { username, password });
      persistAuth(res);
      // No redirigir: quedarse en pestaña administración para mostrar el panel
      // Forzar re-render
      setActiveTab("admin");
    } catch (err) {
      const respData = (err && err.response && err.response.data) ? JSON.stringify(err.response.data) : "";
      const msg = (err && err.message) ? err.message : "";
      setError(respData || msg || "Error al iniciar sesión");
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
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h1 style={{ marginBottom: 0 }}>Iniciar sesión</h1>
            <div className="role-toggle" role="tablist" aria-label="Módulo">
              <button
                type="button"
                className={`role-option ${activeTab === "login" ? "active" : ""}`}
                onClick={() => setActiveTab("login")}
                title="Acceder"
              >
                Acceso
              </button>
              <button
                type="button"
                className={`role-option ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => setActiveTab("admin")}
                title="Administración"
              >
                Administración
              </button>
            </div>
          </div>

          {error && <div className="alert">{error}</div>}

          {activeTab === "login" ? (
            <>
              <p className="form-label">Selecciona tu tipo de usuario y accede</p>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <div className="role-toggle" role="tablist" aria-label="Tipo de usuario">
                    <button
                      type="button"
                      className={`role-option ${role === "student" ? "active" : ""}`}
                      onClick={() => setRole("student")}
                    >
                      Estudiante
                    </button>
                    <button
                      type="button"
                      className={`role-option ${role === "teacher" ? "active" : ""}`}
                      onClick={() => setRole("teacher")}
                    >
                      Catedrático
                    </button>
                  </div>
                </div>
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
            </>
          ) : (
            <>
              <p className="form-label">Módulo de administración (requiere usuario con permisos de administrador)</p>
              {(localStorage.getItem("access") && localStorage.getItem("is_staff") === "true") ? (
                <div style={{ marginTop: 8 }}>
                  <AdminPage />
                </div>
              ) : (
                <>
                  <div className="alert">Inicia sesión como administrador para continuar.</div>
                  <form onSubmit={handleAdminLogin}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="admin-username">Usuario</label>
                      <input
                        id="admin-username"
                        className="input"
                        type="text"
                        placeholder="admin1"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="form-group input-group">
                      <label className="form-label" htmlFor="admin-password">Contraseña</label>
                      <input
                        id="admin-password"
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
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
