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

  // Attachments
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachCard, setAttachCard] = useState(null);
  const [attachUrl, setAttachUrl] = useState("");
  const [attachFile, setAttachFile] = useState(null);
  const [viewAttOpen, setViewAttOpen] = useState(false);
  const [viewCard, setViewCard] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [grades, setGrades] = useState({});

  // Create Task Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
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
      // Cargar cursos donde el usuario es owner (catedrático)
      const boardsRes = await api.get("/boards/");
      const allBoards = boardsRes.data || [];
      const ownerBoards = allBoards.filter((b) => b?.owner?.id === myId);
      setBoards(ownerBoards);

      // Cargar listas
      const res = await api.get("/lists/");
      const allLists = res.data || [];
      if (ownerBoards.length > 0) {
        const firstId = ownerBoards[0].id;
        setSelectedBoard(firstId);
        const filtered = allLists.filter((l) => l.board === firstId);
        setLists(filtered);
        if (filtered.length && !form.list) {
          setForm((f) => ({ ...f, list: filtered[0].id }));
        }
      } else {
        setSelectedBoard("");
        setLists([]);
        setForm((f)=>({ ...f, list: "" }));
      }
    } catch {
      setBoards([]);
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
                  {role === "teacher" && <button className="btn btn-ghost" onClick={() => openAssign(t)}>Asignar</button>}
                  <button className="btn btn-ghost" onClick={() => { setAttachCard(t); setAttachUrl(""); setAttachFile(null); setAttachOpen(true); }}>
                    Adjuntar
                  </button>
                  <button className="btn btn-ghost" onClick={async ()=>{
                    setViewCard(t);
                    try {
                      const { data } = await api.get(`/attachments/?card=${t.id}`);
                      setAttachments(data || []);
                      setGrades({});
                    } catch { setAttachments([]); }
                    setViewAttOpen(true);
                  }}>
                    Ver adjuntos
                  </button>
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
        open={viewAttOpen}
        title={viewCard ? `Adjuntos - ${viewCard.title}` : "Adjuntos"}
        onClose={() => setViewAttOpen(false)}
        footer={<button className="btn btn-ghost" onClick={()=>setViewAttOpen(false)}>Cerrar</button>}
      >
        {attachments.length === 0 && <div className="empty">No hay adjuntos.</div>}
        {attachments.length > 0 && (
          <div className="list">
            {attachments.map((a)=>(
              <div key={a.id} className="item" style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8 }}>
                <div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    {a.file_url && <a className="link" href={a.file_url} target="_blank" rel="noreferrer">Archivo</a>}
                    {a.url && <a className="link" href={a.url} target="_blank" rel="noreferrer">Enlace</a>}
                    <span className="pill">{a.uploader?.username || "—"}</span>
                    {a.is_submission && <span className="pill" style={{ background:"#e8f5e9", borderColor:"#c8e6c9" }}>Entrega</span>}
                  </div>
                  {(a.feedback || a.score !== null) && (
                    <div className="muted" style={{ marginTop:6 }}>
                      {typeof a.score === "number" ? `Puntaje: ${a.score}/100. ` : ""}{a.feedback || ""}
                    </div>
                  )}
                </div>
                {role === "teacher" && (
                  <div style={{ minWidth: 260 }}>
                    <div className="row" style={{ gap:6 }}>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={100}
                        placeholder={typeof a.score === "number" ? String(a.score) : "Puntaje"}
                        value={grades[a.id]?.score ?? ""}
                        onChange={(e)=>setGrades(g=>({ ...g, [a.id]: { ...(g[a.id]||{}), score: e.target.value } }))}
                        style={{ width: 90 }}
                      />
                      <input
                        className="input"
                        placeholder={a.feedback || "Comentario"}
                        value={grades[a.id]?.feedback ?? ""}
                        onChange={(e)=>setGrades(g=>({ ...g, [a.id]: { ...(g[a.id]||{}), feedback: e.target.value } }))}
                        style={{ flex: 1 }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={async ()=>{
                          try {
                            const payload = {};
                            if (grades[a.id]?.score !== undefined && grades[a.id]?.score !== "") payload.score = Number(grades[a.id].score);
                            if (grades[a.id]?.feedback !== undefined) payload.feedback = grades[a.id].feedback;
                            await api.post(`/attachments/${a.id}/grade/`, payload);
                            const { data } = await api.get(`/attachments/?card=${viewCard.id}`);
                            setAttachments(data || []);
                            setGrades({});
                          } catch { setError("No se pudo calificar"); }
                        }}
                      >
                        Calificar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={attachOpen}
        title="Adjuntar archivo o enlace"
        onClose={() => setAttachOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={()=>setAttachOpen(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={async ()=>{
                if (!attachCard) return;
                try {
                  if (attachFile) {
                    const fd = new FormData();
                    fd.append("card", String(attachCard.id));
                    fd.append("file", attachFile);
                    await api.post("/attachments/", fd, { headers: { "Content-Type": "multipart/form-data" } });
                  } else if (attachUrl.trim()) {
                    await api.post("/attachments/", { card: attachCard.id, url: attachUrl.trim() });
                  } else {
                    return;
                  }
                  setAttachOpen(false);
                } catch {
                  setError("No se pudo adjuntar el archivo o enlace");
                }
              }}
            >
              Guardar
            </button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Archivo</label>
          <input className="input" type="file" onChange={(e)=>setAttachFile(e.target.files?.[0] || null)} />
        </div>
        <div className="form-group">
          <label className="form-label">o Enlace</label>
          <input className="input" type="url" value={attachUrl} onChange={(e)=>setAttachUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="muted">Puedes adjuntar un archivo desde tu ordenador o pegar un link.</div>
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
          <label className="form-label">Curso</label>
          <select
            className="input"
            value={selectedBoard}
            onChange={(e)=>{
              const boardId = Number(e.target.value);
              setSelectedBoard(boardId);
              // Refiltrar listas para el curso seleccionado
              api.get("/lists/").then((r)=>{
                const lst = r.data || [];
                const filtered = lst.filter((l)=> l.board === boardId);
                setLists(filtered);
                setForm((f)=>({ ...f, list: filtered[0]?.id || "" }));
              }).catch(()=>{ setLists([]); setForm((f)=>({ ...f, list: "" })); });
            }}
          >
            {boards.length === 0 && <option value="">— No tienes cursos como catedrático —</option>}
            {boards.map((b)=>(
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
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
