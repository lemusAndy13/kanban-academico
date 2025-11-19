// src/pages/Dashboard.jsx

import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Panel Principal</h1>

      <div style={styles.menu}>
        <Link to="/tasks" style={styles.card}>Tareas</Link>
        <Link to="/cursos" style={styles.card}>Cursos</Link>
        <Link to="/calendario" style={styles.card}>Calendario</Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    textAlign: "center",
  },
  title: {
    fontSize: "32px",
    marginBottom: "40px",
  },
  menu: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
  },
  card: {
    padding: "20px 40px",
    background: "#007bff",
    color: "white",
    textDecoration: "none",
    fontSize: "20px",
    borderRadius: "10px",
  }
};
