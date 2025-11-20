// src/pages/Tasks.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../services/axiosConfig";
import Modal from "../components/Modal";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = useMemo(() => localStorage.getItem("role"), []);
  const myId = useMemo(() => Number(localStorage.getItem("user_id") || 0), []);
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterDue, setFilterDue] = useState("all"); // all | 7 | 30

  // Assign Modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCard, setAssignCard] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  // Create Task Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [form, setForm] = useState({
    list: "",
    title: "",
    description: "",
    due_date: "",
    priority: "low",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setError("");
      setLoading(true);
      let qs = "/cards/";
      const params = [];
      if (filterAssignee === "me" && myId) params.push(`assignee=${myId}`);
      if (filterDue !== "all") {
        const now = new Date();
        const target = new Date(now.getTime() + Number(filterDue) * 24*60*60*1000);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth()+1).padStart(2,"0");
        const dd = String(target.getDate()).padStart(2,"0");
        params.push(`due_before=${yyyy}-${mm}-${dd}`);
      }
      if (params.length) qs += `?${params.join("&")}`;
      const { data } = await api.get(qs);
      setTasks(data);
    } catch (error) {
      setError("No se pudieron cargar las tareas");
    }
    finally {
      setLoading(false);
    }
  };

  const openAssign = async (card) => {
    try {
      setAssignCard(card);
      setSelectedAssignees(card.assignees?.map(a => a) || []);
      setAssignOpen(true);
      if (card.board) {
        const res = await api.get(`/boards/${card.board}/members/`);
        setMembers(res.data || []);
      } else {
        setMembers([]);
      }
    } catch {
      setMembers([]);
    }
  };

  const toggleAssignee = (userId) => {
    setSelectedAssignees((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const saveAssignees = async () => {
    if (!assignCard) return;
    try {
      await api.patch(`/cards/${assignCard.id}/`, { assignees: selectedAssignees });
      // reflect local
      setTasks((prev) => prev.map((t) => t.id === assignCard.id ? { ...t, assignees: selectedAssignees } : t));
      setAssignOpen(false);
    } catch {
      setError("No se pudo asignar la tarea");
    }
  };

  const openCreate = async () => {
    try {
      setCreateOpen(true);
      const res = await api.get("/lists/");
      setLists(res.data || []);
      if (res.data?.length && !form.list) {
        setForm((f) => ({ ...f, list: res.data[0].id }));
      }
    } catch {
      setLists([]);
    }
  };

  const saveCreate = async () => {
    try {
      if (!form.title || !form.list) return;
      const payload = { ...form };
      // Vacíos a null
      if (!payload.description) delete payload.description;
      if (!payload.due_date) delete payload.due_date;
      const { data } = await api.post("/cards/", payload);
      setTasks((prev) => [data, ...prev]);
      setCreateOpen(false);
      setForm({ list: "", title: "", description: "", due_date: "", priority: "low" });
    } catch {
      setError("No se pudo crear la tarea");
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Tareas</h1>
        <div className="toolbar">
          <span className="pill">Total: {tasks.length}</span>
          <select className="input" value={filterAssignee} onChange={(e)=>{setFilterAssignee(e.target.value);}} style={{ width: 160 }}>
            <option value="all">Asignadas (todas)</option>
            <option value="me">Asignadas a mí</option>
          </select>
          <select className="input" value={filterDue} onChange={(e)=>{setFilterDue(e.target.value);}} style={{ width: 180 }}>
            <option value="all">Vencimiento (todas)</option>
            <option value="7">Próximos 7 días</option>
            <option value="30">Próximos 30 días</option>
          </select>
          <button className="btn btn-ghost" onClick={fetchTasks}>Aplicar</button>
          {role === "teacher" && (
            <button className="btn btn-primary btn-large" onClick={openCreate}>
              Nueva tarea
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && <div className="empty">Cargando tareas...</div>}

      {!loading && tasks.length === 0 && (
        <div className="empty">No hay tareas aún.</div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="cards-grid">
          {tasks.map((t) => {
            return (
              <div key={t.id} className="card-item">
                <h3>{t.title}</h3>
                <p className="muted">{t.description || "Sin descripción"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  {t.due_date && <span className="pill">Vence: {new Date(t.due_date).toLocaleDateString()}</span>}
                  <span className="pill">Prioridad: {t.priority}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                  {role === "teacher" && (
                    <button className="btn btn-ghost" onClick={() => openAssign(t)}>Asignar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={assignOpen}
        title="Asignar tarea a estudiantes"
        onClose={() => setAssignOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setAssignOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={saveAssignees}>Guardar</button>
          </>
        )}
      >
        {!assignCard ? (
          <div className="empty">Selecciona una tarjeta</div>
        ) : (
          <div>
            <p className="muted" style={{ marginTop: 0, marginBottom: 10 }}>{assignCard.title}</p>
            {members.length === 0 && <div className="empty">No hay miembros en el tablero.</div>}
            {members.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {members.map((m) => (
                  <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(m.id)}
                      onChange={() => toggleAssignee(m.id)}
                    />
                    {m.username}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={createOpen}
        title="Nueva tarea"
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={saveCreate}>Crear</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Lista</label>
          <select
            className="input"
            value={form.list}
            onChange={(e) => setForm((f) => ({ ...f, list: Number(e.target.value) }))}
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Título</label>
          <input
            className="input"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Nombre de la tarea"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea
            className="input"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Detalles…"
          />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Fecha límite</label>
            <input
              className="input"
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ width: 180 }}>
            <label className="form-label">Prioridad</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              <option value="low">Baja</option>
              <option value="med">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: "30px" },
  button: { display: "none" }
};
