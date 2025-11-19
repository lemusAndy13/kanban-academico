// src/pages/Tasks.jsx

import { useEffect, useState } from "react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("access");

      const response = await fetch("http://127.0.0.1:8000/api/cards/", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.log("Error cargando tareas:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Tareas</h1>

      <button style={styles.button}>Nueva tarea</button>

      <div style={styles.list}>
        {tasks.map((t) => (
          <div key={t.id} style={styles.task}>
            <h3>{t.title}</h3>
            <p>{t.description}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  container: { padding: "30px" },
  button: {
    background: "#28a745",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "20px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  task: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px"
  }
};
