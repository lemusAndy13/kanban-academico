import { useEffect, useMemo, useState } from "react";
import api from "../services/axiosConfig";
import Modal from "../components/Modal";

type Board = {
  id: number;
  name: string;
  color: string;
  members?: Array<{ id: number; username: string }>;
};

export default function Courses() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const role = useMemo(() => localStorage.getItem("role"), []);
  const [defaults, setDefaults] = useState<Array<{id:number; code:string; name:string; room:string}>>([]);

  // Create course
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", color: "#0d6efd" });

  // Invite
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBoard, setInviteBoard] = useState<Board | null>(null);
  const [username, setUsername] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    loadBoards();
    if (role === "teacher") {
      loadDefaults();
    }
  }, []);

  const loadBoards = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get("/boards/");
      setBoards(data || []);
    } catch {
      setError("No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  };

  const loadDefaults = async () => {
    try {
      const { data } = await api.get("/default-courses/");
      setDefaults(data || []);
    } catch {
      // ignorar si no es catedrático
    }
  };

  const submitCreate = async () => {
    try {
      if (!createForm.name) return;
      const { data } = await api.post("/boards/", createForm);
      setBoards((prev) => [data, ...prev]);
      setCreateOpen(false);
      setCreateForm({ name: "", color: "#0d6efd" });
    } catch {
      setError("No se pudo crear el curso.");
    }
  };

  const createFromDefault = async (course: {name:string}) => {
    try {
      const payload = { name: course.name, color: "#1976d2" };
      const { data } = await api.post("/boards/", payload);
      setBoards((prev) => [data, ...prev]);
    } catch {
      setError("No se pudo crear el curso desde la plantilla.");
    }
  };

  const openInvite = (b: Board) => {
    setInviteBoard(b);
    setUsername("");
    setInviteMsg("");
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    if (!inviteBoard || !username) return;
    try {
      await api.post(`/boards/${inviteBoard.id}/invite/`, { username });
      setInviteMsg("Invitación enviada.");
    } catch (e) {
      setInviteMsg("No se pudo invitar. Verifica el usuario.");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Cursos</h1>
        {role === "teacher" && (
          <button className="btn btn-primary btn-large" onClick={() => setCreateOpen(true)}>
            Nuevo curso
          </button>
        )}
      </div>

      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}
      {loading && <div className="empty">Cargando cursos…</div>}

      {!loading && boards.length === 0 && <div className="empty">Aún no tienes cursos.</div>}

      {!loading && boards.length > 0 && (
        <div className="cards-grid" style={{ marginTop: 16 }}>
          {boards.map((b) => (
            <div key={b.id} className="card-item">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>{b.name}</h3>
                <div className="pill" style={{ background: "#fff" }}>Miembros: {b.members?.length ?? "—"}</div>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <a className="btn btn-ghost" href={`/board/${b.id}`}>Abrir tablero</a>
                {role === "teacher" && (
                  <button className="btn btn-ghost" onClick={() => openInvite(b)}>
                    Invitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {role === "teacher" && defaults.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Plantillas de cursos disponibles</h3>
          <div className="list">
            {defaults.map((c) => (
              <div key={c.id} className="item" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <strong>{c.code}</strong> — {c.name} <span className="muted">({c.room})</span>
                </div>
                <div>
                  <button className="btn btn-primary" onClick={() => createFromDefault(c)}>Crear</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        title="Nuevo curso"
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submitCreate}>Crear</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            className="input"
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Curso de Matemática I"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input
            className="input"
            type="color"
            value={createForm.color}
            onChange={(e) => setCreateForm((f) => ({ ...f, color: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={inviteOpen}
        title={`Invitar a ${inviteBoard?.name ?? ""}`}
        onClose={() => setInviteOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Cerrar</button>
            <button className="btn btn-primary" onClick={submitInvite}>Invitar</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Usuario</label>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username del estudiante"
          />
        </div>
        {inviteMsg && <div className="empty" style={{ color: "var(--text)", padding: 0, textAlign: "left" }}>{inviteMsg}</div>}
      </Modal>
    </div>
  );
}


