import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/axiosConfig";

type List = { id: number; board: number; title: string; position: number };
type Card = { id: number; list: number; title: string; description?: string; position: number };

export default function BoardPage() {
  const { id } = useParams();
  const boardId = Number(id);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [listsRes, cardsRes] = await Promise.all([api.get("/lists/"), api.get("/cards/")]);
        const boardLists = (listsRes.data || []).filter((l: List) => l.board === boardId).sort((a: List, b: List) => a.position - b.position);
        setLists(boardLists);
        setCards((cardsRes.data || []).filter((c: Card) => boardLists.some((l) => l.id === c.list)));
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
    </div>
  );
}



