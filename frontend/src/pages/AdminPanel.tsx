import { useEffect, useMemo, useState } from "react";
import api from "../services/axiosConfig";
import Modal from "../components/Modal";

type Role = "student" | "teacher";
type AdminUser = { id:number; username:string; email:string; is_active:boolean; is_staff:boolean; profile_role?: Role|null };
type Board = { id:number; name:string; color:string; members?: Array<{id:number; username:string}> };

export default function AdminPanel() {
  const isStaff = localStorage.getItem("is_staff") === "true";
  const [tab, setTab] = useState<"courses"|"users">("courses");

  if (!isStaff) {
    return <div className="container"><h1>Administración</h1><p>No autorizado.</p></div>;
  }
  return (
    <div className="container">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h1 style={{ margin:0 }}>Administración</h1>
        <div className="role-toggle">
          <button className={`role-option ${tab==='courses'?'active':''}`} onClick={()=>setTab("courses")}>Cursos</button>
          <button className={`role-option ${tab==='users'?'active':''}`} onClick={()=>setTab("users")}>Usuarios</button>
        </div>
      </div>
      {tab === "courses" ? <CoursesAdmin /> : <UsersAdmin />}
    </div>
  );
}

function CoursesAdmin() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name:"", color:"#1976d2" });
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignBoard, setAssignBoard] = useState<Board|null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const teachers = useMemo(()=>users.filter(u=>u.profile_role==='teacher'), [users]);
  const students = useMemo(()=>users.filter(u=>u.profile_role==='student'), [users]);
  const [teacherRef, setTeacherRef] = useState<string>("");
  const [studentsCsv, setStudentsCsv] = useState<string>("");

  useEffect(()=>{ loadBoards(); }, []);
  useEffect(()=>{ loadUsers(); }, []);

  const loadBoards = async () => {
    try {
      setLoading(true); setError("");
      const { data } = await api.get("/boards/");
      setBoards(data || []);
    } catch { setError("No se pudieron cargar los cursos."); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get("/admin/users/");
      setUsers(data || []);
    } catch { /* ignore */ }
  };

  const submitCreate = async () => {
    if (!form.name) return;
    try {
      const { data } = await api.post("/boards/", form);
      setBoards(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name:"", color:"#1976d2" });
    } catch { setError("No se pudo crear el curso."); }
  };

  const openAssign = (b: Board) => {
    setAssignBoard(b);
    setTeacherRef("");
    setStudentsCsv("");
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    if (!assignBoard) return;
    try {
      await api.post(`/boards/${assignBoard.id}/assign/`, {
        teacher: teacherRef || undefined,
        students: studentsCsv,
      });
      setAssignOpen(false);
      await loadBoards();
    } catch {
      setError("No se pudo asignar docente/alumnos.");
    }
  };

  return (
    <>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:12 }}>
        <button className="btn btn-ghost" onClick={loadBoards} disabled={loading}>Refrescar</button>
        <button className="btn btn-primary" onClick={()=>setCreateOpen(true)}>Nuevo curso</button>
      </div>
      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}
      {!loading && boards.length === 0 && <div className="empty">No hay cursos.</div>}
      {!loading && boards.length > 0 && (
        <div className="cards-grid" style={{ marginTop: 16 }}>
          {boards.map((b)=>(
            <div key={b.id} className="card-item">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <h3 style={{ margin:0 }}>{b.name}</h3>
                <div className="pill" style={{ background:"#fff" }}>Miembros: {b.members?.length ?? "—"}</div>
              </div>
              <div style={{ marginTop:10, display:"flex", gap:8, justifyContent:"flex-end" }}>
                <a className="btn btn-ghost" href={`/board/${b.id}`}>Abrir</a>
                <button className="btn btn-ghost" onClick={()=>openAssign(b)}>Asignar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={createOpen}
        title="Nuevo curso"
        onClose={()=>setCreateOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={()=>setCreateOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submitCreate}>Crear</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input className="input" value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} placeholder="Ej. Matemática I" />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input className="input" type="color" value={form.color} onChange={(e)=>setForm(f=>({...f, color:e.target.value}))} />
        </div>
      </Modal>

      <Modal
        open={assignOpen}
        title={`Asignar a ${assignBoard?.name ?? ''}`}
        onClose={()=>setAssignOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={()=>setAssignOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submitAssign}>Guardar</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Catedrático</label>
          <select className="input" value={teacherRef} onChange={(e)=>setTeacherRef(e.target.value)}>
            <option value="">(sin cambio)</option>
            {teachers.map(t=>(
              <option key={t.id} value={t.username}>{t.username} ({t.email || '-'})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Alumnos (usernames separados por coma)</label>
          <input className="input" placeholder="alumno1, alumno2, alumno3" value={studentsCsv} onChange={(e)=>setStudentsCsv(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<{username:string; email:string; password:string; role:Role; is_staff:boolean}>({
    username:"", email:"", password:"", role:"student", is_staff:false
  });

  const loadUsers = async () => {
    try {
      setLoading(true); setError("");
      const { data } = await api.get("/admin/users/");
      setUsers(data || []);
    } catch (e:any) { setError(e?.response?.data?.detail || "No se pudo cargar usuarios"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ loadUsers(); }, []);

  const createUser = async () => {
    try {
      if (!form.username.trim()) {
        setError("El usuario es obligatorio.");
        return;
      }
      // Validación rápida de duplicado en la lista actual
      if (users.some((u:any) => String(u.username).toLowerCase() === form.username.trim().toLowerCase())) {
        setError("El usuario ya existe.");
        return;
      }
      const payload: any = { ...form, username: form.username.trim(), is_active: true };
      if (!payload.password) delete payload.password;
      const { data } = await api.post("/admin/users/", payload);
      setUsers(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ username:"", email:"", password:"", role:"student", is_staff:false });
    } catch (e:any) {
      const data = e?.response?.data;
      let message = e?.message || "No se pudo crear usuario";
      if (typeof data === "string") {
        message = data;
      } else if (data && typeof data === "object") {
        // Construir mensaje a partir de errores de campos
        const parts: string[] = [];
        Object.entries(data).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            parts.push(`${k}: ${v.join(", ")}`);
          } else if (typeof v === "string") {
            parts.push(`${k}: ${v}`);
          }
        });
        if (parts.length) message = parts.join(" | ");
      }
      setError(message);
    }
  };

  const toggleActive = async (u: AdminUser) => {
    try { await api.patch(`/admin/users/${u.id}/`, { is_active: !u.is_active }); await loadUsers(); }
    catch (e:any) { setError(e?.response?.data?.detail || "No se pudo actualizar estado"); }
  };

  const toggleStaff = async (u: AdminUser) => {
    try { await api.patch(`/admin/users/${u.id}/`, { is_staff: !u.is_staff }); await loadUsers(); }
    catch (e:any) { setError(e?.response?.data?.detail || "No se pudo actualizar permisos"); }
  };

  return (
    <>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:12 }}>
        <button className="btn btn-ghost" onClick={loadUsers} disabled={loading}>Refrescar</button>
        <button className="btn btn-primary" onClick={()=>setCreateOpen(true)}>Nuevo usuario</button>
      </div>
      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}
      {!loading && users.length === 0 && <div className="empty">No hay usuarios.</div>}
      {!loading && users.length > 0 && (
        <div className="cards-grid" style={{ marginTop: 16 }}>
          {users.map((u)=>(
            <div key={u.id} className="card-item">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <h3 style={{ margin:0 }}>{u.username}</h3>
                <div className="pill">{u.profile_role || "-"}</div>
              </div>
              <div className="muted">{u.email || "-"}</div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:10 }}>
                <button className="btn btn-ghost" onClick={()=>toggleActive(u)}>{u.is_active ? "Desactivar" : "Activar"}</button>
                <button className="btn btn-ghost" onClick={()=>toggleStaff(u)}>{u.is_staff ? "Quitar staff" : "Hacer staff"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={createOpen}
        title="Nuevo usuario"
        onClose={()=>setCreateOpen(false)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={()=>setCreateOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={createUser}>Crear</button>
          </>
        )}
      >
        <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
          <div>
            <label className="form-label">Usuario</label>
            <input className="input" value={form.username} onChange={(e)=>setForm(f=>({...f, username:e.target.value}))} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e)=>setForm(f=>({...f, email:e.target.value}))} />
          </div>
          <div>
            <label className="form-label">Contraseña (opcional)</label>
            <input className="input" type="text" value={form.password} onChange={(e)=>setForm(f=>({...f, password:e.target.value}))} />
          </div>
          <div>
            <label className="form-label">Rol</label>
            <select className="input" value={form.role} onChange={(e)=>setForm(f=>({...f, role:e.target.value as Role}))}>
              <option value="student">Estudiante</option>
              <option value="teacher">Catedrático</option>
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end" }}>
            <label className="checkbox">
              <input type="checkbox" checked={form.is_staff} onChange={(e)=>setForm(f=>({...f, is_staff:e.target.checked}))} />
              <span>Administrador (staff)</span>
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
}


