import { useEffect, useMemo, useState } from "react";
import api from "../services/axiosConfig";

type Card = {
  id: number;
  title: string;
  description?: string;
  due_date?: string | null;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [current, setCurrent] = useState<Date>(startOfMonth(new Date()));
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/cards/");
        setCards(data || []);
      } catch (_e) {
        setError("No se pudieron cargar las tareas del calendario.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const groupedByDate = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const c of cards) {
      if (!c.due_date) continue;
      // Normalizamos a YYYY-MM-DD sin hora
      const dt = new Date(c.due_date);
      const ymd = formatYmd(dt);
      if (!map[ymd]) map[ymd] = [];
      map[ymd].push(c);
    }
    return map;
  }, [cards]);

  const daysMatrix = useMemo(() => {
    const start = startOfMonth(current);
    const end = endOfMonth(current);
    const startWeekday = (start.getDay() + 6) % 7; // Lunes=0
    const totalDays = end.getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    // Padding antes del 1 del mes
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (startWeekday - i));
      cells.push({ date: d, inMonth: false });
    }
    // Días del mes
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(current);
      d.setDate(day);
      cells.push({ date: d, inMonth: true });
    }
    // Completar hasta múltiplos de 7
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }
    return cells;
  }, [current]);

  const monthLabel = useMemo(() => {
    return current.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [current]);

  const selectedTasks = selectedDate ? groupedByDate[selectedDate] || [] : [];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => setCurrent(addMonths(current, -1))}>← Mes anterior</button>
        <h2 style={{ margin: 0, textTransform: "capitalize" }}>{monthLabel}</h2>
        <button className="btn btn-ghost" onClick={() => setCurrent(addMonths(current, 1))}>Mes siguiente →</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && <div className="empty">Cargando calendario...</div>}

      <div className="calendar">
        <div className="calendar-grid calendar-head">
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
            <div key={d} className="cell head">{d}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {daysMatrix.map(({ date, inMonth }) => {
            const ymd = formatYmd(date);
            const events = groupedByDate[ymd] || [];
            const hasEvents = events.length > 0;
            return (
              <button
                key={ymd}
                className={`cell day ${inMonth ? "" : "muted"} ${hasEvents ? "has-events" : ""}`}
                onClick={() => setSelectedDate(ymd)}
                title={hasEvents ? `${events.length} tarea(s)` : ""}
              >
                <div className="day-num">{date.getDate()}</div>
                {hasEvents && <div className="badges">{events.length}</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {!selectedDate && <div className="empty">Selecciona un día para ver sus tareas.</div>}
        {selectedDate && (
          <div className="card" style={{ maxWidth: 720 }}>
            <h3 style={{ marginTop: 0 }}>Tareas del {selectedDate}</h3>
            {selectedTasks.length === 0 ? (
              <div className="empty">Sin tareas para este día.</div>
            ) : (
              <div className="list">
                {selectedTasks.map((t) => (
                  <div key={t.id} className="item">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{t.title}</strong>
                      <small style={{ color: "var(--muted)" }}>{t.due_date?.slice(11,16) || ""}</small>
                    </div>
                    {t.description && <p style={{ marginTop: 6 }}>{t.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



