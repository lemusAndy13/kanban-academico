import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/token/", {
        username,
        password,
      });

      localStorage.setItem("access", res.data.access);
      if (res.data.refresh) {
        localStorage.setItem("refresh", res.data.refresh);
      }

      navigate("/boards");
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Error al iniciar sesión"
      );
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Login</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button>Entrar</button>
      </form>
    </div>
  );
}
