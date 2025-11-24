import { useEffect, useState } from "react";
import api from "../services/axiosConfig";

type Board = { id:number; name:string; color:string; members?: Array<{id:number; username:string}> };

export default function AdminCourses() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isStaff = localStorage.getItem("is_staff") === "true";

  useEffect(() => {
    if (isStaff) loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/boards/");
      setBoards(data || []);
    } catch {
      setError("No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  };

  if (!isStaff) {
    return <div className="container"><h1>Administración</h1><p>No autorizado.</p></div>;
  }

  return (
    <div className="container">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h1 style={{ margin:0 }}>Cursos (Administración)</h1>
        <button className="btn btn-ghost" onClick={loadBoards} disabled={loading}>Refrescar</button>
      </div>

      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}
      {loading && <div className="empty">Cargando…</div>}
      {!loading && boards.length === 0 && <div className="empty">No hay cursos visibles.</div>}

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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


