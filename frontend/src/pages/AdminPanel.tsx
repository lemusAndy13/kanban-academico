import { useEffect, useMemo, useState } from "react";
import api from "../services/axiosConfig";
import Modal from "../components/Modal";

type Role = "student" | "teacher";
type AdminUser = { id:number; username:string; email:string; is_active:boolean; profile_role?: Role|null; name?: string };
type Board = { id:number; code?:string; name:string; color:string; owner?: {id:number; username:string}; members?: Array<{id:number; username:string}> };

export default function AdminPanel() {
  const isAdmin = localStorage.getItem("is_admin") === "true";
  const [tab, setTab] = useState<"courses"|"users">("courses");

  if (!isAdmin) {
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
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [manageOpen, setManageOpen] = useState<null|Board>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [teacherId, setTeacherId] = useState<number|"">("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [replaceStudents, setReplaceStudents] = useState(false);

  useEffect(()=>{ loadBoards(); loadUsers(); }, []);

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
      setAdminUsers(data || []);
    } catch {
      // silencioso para no ensuciar la UI de cursos
    }
  };

  // Cuando se abre el modal de asignación, precargar selección actual
  useEffect(()=>{
    if (!manageOpen) return;
    const currentTeacherId = manageOpen.owner?.id ?? "";
    setTeacherId(currentTeacherId);
    // Mapear miembros actuales a estudiantes por id usando catálogo adminUsers
    const studentIds = (manageOpen.members || [])
      .map(m => {
        const found = adminUsers.find(u => u.username === m.username);
        return found && found.profile_role === "student" ? found.id : null;
      })
      .filter((v): v is number => typeof v === "number");
    setSelectedStudentIds(studentIds);
    setReplaceStudents(false);
  }, [manageOpen, adminUsers]);

  const teacherOptions = useMemo(()=>adminUsers.filter(u => u.profile_role === "teacher"), [adminUsers]);
  const studentOptions = useMemo(()=>adminUsers.filter(u => u.profile_role === "student"), [adminUsers]);

  const submitCreate = async () => {
    if (!form.name) {
      setError("Completa el nombre del curso.");
      return;
    }
    try {
      setCreating(true); setFormError("");
      const { data } = await api.post("/boards/", form);
      setBoards(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name:"", color:"#1976d2" });
    } catch (e:any) {
      setError(e?.response?.data?.name?.[0] || "No se pudo crear el curso.");
    } finally {
      setCreating(false);
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
                <div className="pill" style={{ background:"#fff" }}>{b.code || `ID #${b.id}`}</div>
              </div>
              <div style={{ marginTop:10, display:"flex", gap:8, justifyContent:"flex-end" }}>
                <a className="btn btn-ghost" href={`/board/${b.id}`}>Abrir</a>
                <button className="btn btn-ghost" onClick={()=>{
                  setManageOpen(b);
                }}>Asignar</button>
              </div>
              <div className="muted" style={{ marginTop:8 }}>Miembros: {b.members?.length ?? "—"}</div>
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
            <button className="btn btn-primary" onClick={submitCreate} disabled={!form.name || creating}>
              {creating ? "Creando..." : "Crear"}
            </button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            className="input"
            value={form.name}
            onChange={(e)=>{
              setFormError("");
              setForm(f=>({...f, name:e.target.value}));
            }}
            placeholder="Ej. Matemática I"
            autoFocus
            onKeyDown={(e)=>{ if (e.key === "Enter" && form.name) submitCreate(); }}
          />
          <div className="muted">El ID del curso se generará automáticamente.</div>
          {formError && <div className="alert">{formError}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input className="input" type="color" value={form.color} onChange={(e)=>setForm(f=>({...f, color:e.target.value}))} />
          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            {["#1976d2","#0ea5e9","#22c55e","#f59e0b","#ef4444","#8b5cf6"].map(c=>(
              <button
                key={c}
                className="btn btn-ghost"
                style={{ width: 28, height: 28, padding: 0, background: c, borderColor: c }}
                onClick={()=>setForm(f=>({...f, color: c}))}
                title={c}
              />
            ))}
          </div>
        </div>
      </Modal>
      <Modal
        open={!!manageOpen}
        title={`Asignar participantes${manageOpen ? ` - ${manageOpen.name}` : ""}`}
        onClose={()=>setManageOpen(null)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={()=>setManageOpen(null)}>Cerrar</button>
            <button
              className="btn btn-primary"
              onClick={async ()=>{
                if (!manageOpen) return;
                try {
                  setError("");
                  // teacher
                  if (teacherId) {
                    const t = adminUsers.find(u => u.id === teacherId);
                    if (t) {
                      await api.post(`/boards/${manageOpen.id}/set_teacher/`, { username: t.username });
                    }
                  }
                  // students
                  const usernames = selectedStudentIds.map(id => adminUsers.find(u => u.id === id)?.username).filter(Boolean) as string[];
                  await api.post(`/boards/${manageOpen.id}/set_students/`, { usernames, replace: replaceStudents });
                  await loadBoards();
                  setManageOpen(null);
                } catch (e:any) {
                  setError(e?.response?.data?.detail || "No se pudieron asignar participantes");
                }
              }}
            >Guardar</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Catedrático</label>
          <select className="input" value={teacherId} onChange={(e)=>setTeacherId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">— Seleccionar —</option>
            {teacherOptions.map(t=>(
              <option key={t.id} value={t.id}>{t.username}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estudiantes (selección múltiple)</label>
          <select
            className="input"
            multiple
            value={selectedStudentIds.map(String)}
            onChange={(e)=>{
              const selected = Array.from(e.target.selectedOptions).map(o => Number(o.value));
              setSelectedStudentIds(selected);
            }}
            style={{ minHeight: 160 }}
          >
            {studentOptions.map(s=>(
              <option key={s.id} value={s.id}>{s.username}</option>
            ))}
          </select>
          <label className="checkbox" style={{ marginTop: 8, display:"inline-flex", alignItems:"center", gap:8 }}>
            <input type="checkbox" checked={replaceStudents} onChange={(e)=>setReplaceStudents(e.target.checked)} />
            <span>Reemplazar estudiantes actuales</span>
          </label>
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
  const [form, setForm] = useState<{username:string; email:string; password:string; role:Role}>({
    username:"", email:"", password:"", role:"student"
  });
  const [passOpen, setPassOpen] = useState<null|AdminUser>(null);
  const [newPass, setNewPass] = useState("");

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
      const payload: any = { ...form };
      // Usar el email como username en el backend
      payload.username = form.email;
      if (!payload.password) delete (payload as any).password;
      const { data } = await api.post("/admin/users/", payload);
      setUsers(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ username:"", email:"", password:"", role:"student" });
    } catch (e:any) { setError(e?.response?.data?.detail || "No se pudo crear usuario"); }
  };

  const toggleActive = async (u: AdminUser) => {
    try { await api.patch(`/admin/users/${u.id}/`, { is_active: !u.is_active }); await loadUsers(); }
    catch (e:any) { setError(e?.response?.data?.detail || "No se pudo actualizar estado"); }
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
                <h3 style={{ margin:0 }}>{u.name || u.username}</h3>
                <div className="pill">{u.profile_role || "-"}</div>
              </div>
              <div className="muted">{u.email || "-"}</div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:10 }}>
                <button className="btn btn-ghost" onClick={()=>toggleActive(u)}>{u.is_active ? "Desactivar" : "Activar"}</button>
                <button className="btn btn-ghost" onClick={()=>{ setPassOpen(u); setNewPass(""); }}>Contraseña</button>
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
            <label className="form-label">Nombre completo</label>
            <input className="input" value={(form as any).full_name || ""} onChange={(e)=>setForm((f:any)=>({...f, full_name:e.target.value}))} />
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
        </div>
      </Modal>
      <Modal
        open={!!passOpen}
        title={`Restablecer contraseña${passOpen ? ` - ${passOpen.name || passOpen.username}` : ""}`}
        onClose={()=>setPassOpen(null)}
        footer={(
          <>
            <button className="btn btn-ghost" onClick={()=>setPassOpen(null)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={async ()=>{
                if (!passOpen || !newPass) return;
                try {
                  await api.post(`/admin/users/${passOpen.id}/set_password/`, { password: newPass });
                  setPassOpen(null);
                } catch (e:any) {
                  setError(e?.response?.data?.detail || "No se pudo actualizar la contraseña");
                }
              }}
              disabled={!newPass}
            >Guardar</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Nueva contraseña</label>
          <input className="input" type="text" value={newPass} onChange={(e)=>setNewPass(e.target.value)} />
          <div className="muted">El usuario iniciará con email + esta contraseña.</div>
        </div>
      </Modal>
    </>
  );
}


