import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/axiosConfig";

type List = { id: number; board: number; title: string; position: number };
type Card = { id: number; list: number; title: string; description?: string; position: number };
type Announcement = { id:number; board:number; title:string; content:string; is_pinned:boolean; created_at:string };
type BoardInfo = { id:number; name:string; owner?: { id:number; username:string; }; };

export default function BoardPage() {
  const { id } = useParams();
  const boardId = Number(id);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [annOpen, setAnnOpen] = useState(false);
  const [annForm, setAnnForm] = useState({ title:"", content:"" });
  const myId = Number(localStorage.getItem("user_id") || 0);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [listsRes, cardsRes, annsRes, boardsRes] = await Promise.all([api.get("/lists/"), api.get("/cards/"), api.get(`/announcements/?board=${boardId}`), api.get("/boards/")]);
        const boardLists = (listsRes.data || []).filter((l: List) => l.board === boardId).sort((a: List, b: List) => a.position - b.position);
        setLists(boardLists);
        setCards((cardsRes.data || []).filter((c: Card) => boardLists.some((l) => l.id === c.list)));
        setAnns(annsRes.data || []);
        const boardInfo = (boardsRes.data || []).find((b:BoardInfo)=>b.id===boardId) as BoardInfo|undefined;
        setIsOwner(Boolean(boardInfo?.owner?.id && boardInfo.owner.id === myId));
      } catch {
        setError("No se pudo cargar el tablero.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [boardId]);

  const cardsByList = useMemo(() => {
    const map: Record<number, Card[]> = {};
    for (const l of lists) map[l.id] = [];
    for (const c of cards) {
      if (!map[c.list]) map[c.list] = [];
      map[c.list].push(c);
    }
    for (const lid of Object.keys(map)) {
      map[Number(lid)].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [lists, cards]);

  // DnD - HTML5
  const [dragCard, setDragCard] = useState<Card | null>(null);
  const onDragStart = (c: Card) => setDragCard(c);
  const onDropOnList = async (listId: number, index: number) => {
    if (!dragCard) return;
    try {
      await api.patch(`/cards/${dragCard.id}/move/`, { list: listId, position: index });
      setCards((prev) => {
        const moved = { ...dragCard, list: listId, position: index };
        const others = prev.filter((c) => c.id !== dragCard.id);
        return [...others, moved];
      });
    } catch {
      setError("No se pudo mover la tarjeta");
    } finally {
      setDragCard(null);
    }
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  return (
    <div style={{ padding: 8 }}>
      <h2>Tablero</h2>
      {error && <div className="alert">{error}</div>}
      {loading && <div className="empty">Cargando…</div>}

      {/* Anuncios */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <strong>Publicaciones</strong>
          {isOwner && <button className="btn btn-ghost" onClick={()=>{ setAnnForm({ title:"", content:"" }); setAnnOpen(true); }}>Nueva publicación</button>}
        </div>
        {anns.length === 0 && <div className="empty">Aún no hay publicaciones.</div>}
        {anns.length > 0 && (
          <div className="list" style={{ marginTop: 8 }}>
            {anns.map((a)=> (
              <div key={a.id} className="item">
                <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"space-between" }}>
                  <strong>{a.title}</strong>
                  {a.is_pinned && <span className="pill">Principal</span>}
                </div>
                {a.content && <div className="muted" style={{ marginTop:6, whiteSpace:"pre-wrap" }}>{a.content}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", overflowX: "auto" }}>
        {lists.map((l) => {
          const listCards = cardsByList[l.id] || [];
          return (
            <div key={l.id} style={{ minWidth: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
              <strong>{l.title}</strong>
              <div
                onDragOver={allowDrop}
                onDrop={(e) => onDropOnList(l.id, listCards.length)}
                style={{ minHeight: 24 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {listCards.map((c, idx) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c)}
                    onDragOver={allowDrop}
                    onDrop={() => onDropOnList(l.id, idx)}
                    className="item"
                    style={{ cursor: "grab" }}
                  >
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    {c.description && <div className="muted" style={{ marginTop: 4 }}>{c.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal publicación */}
      {annOpen && (
        <div className="modal-backdrop" onClick={()=>setAnnOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header"><h3>Nueva publicación</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="input" value={annForm.title} onChange={(e)=>setAnnForm(f=>({ ...f, title:e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Contenido</label>
                <textarea className="input" value={annForm.content} onChange={(e)=>setAnnForm(f=>({ ...f, content:e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setAnnOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={async ()=>{
                try {
                  if (!annForm.title) return;
                  await api.post("/announcements/", { board: boardId, title: annForm.title, content: annForm.content, is_pinned: false });
                  const { data } = await api.get(`/announcements/?board=${boardId}`);
                  setAnns(data || []);
                  setAnnOpen(false);
                  setAnnForm({ title:"", content:"" });
                } catch { setError("No se pudo crear la publicación"); }
              }}>Publicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




