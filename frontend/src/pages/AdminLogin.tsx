import { useState } from "react";
import api from "../services/axiosConfig";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError("");
      if (!username || !password) {
        setError("Completa usuario y contraseña");
        return;
      }
      setLoading(true);
      const res = await api.post("/token/", { username, password });
      const isStaff = Boolean(res.data?.is_staff);
      if (!isStaff) {
        setError("Este usuario no es administrador.");
        return;
      }
      localStorage.setItem("access", res.data.access);
      if (res.data.refresh) localStorage.setItem("refresh", res.data.refresh);
      if (res.data.role) localStorage.setItem("role", res.data.role);
      if (res.data.username) localStorage.setItem("username", res.data.username);
      if (typeof res.data.is_staff !== "undefined") {
        localStorage.setItem("is_staff", String(isStaff));
      }
      navigate("/admin");
    } catch (err) {
      setError(err?.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen bg-gradient">
      <div className="card" style={{ maxWidth: 420 }}>
        <h1>Administración</h1>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="a-user">Usuario</label>
            <input id="a-user" className="input" value={username} onChange={(e)=>setUsername(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="a-pass">Contraseña</label>
            <input id="a-pass" className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


