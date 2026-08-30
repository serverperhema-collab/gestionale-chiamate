"use client";

import { useState, useEffect, useCallback } from "react";
import { Printer, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import AttendanceModal from "./AttendanceModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  status: "PRESENTE" | "PARZIALE" | "ASSENTE";
  shiftMorning: boolean;
  shiftAfternoon: boolean;
  plannedHours: number;
  hoursWorked: number;
  reason: "MALATTIA" | "FERIE" | "PERMESSO" | "ALTRO" | null;
  customReason: string | null;
};

type OperatorData = {
  id: string;
  name: string;
  attendances: AttendanceRecord[];
  stats: {
    totalHours: number;
    presenti: number;
    parziali: number;
    totalAbsences: number;
    ferie: number;
    malattia: number;
    permessi: number;
    altro: number;
  };
};

type GlobalStats = {
  totalHours: number;
  presenti: number;
  totalAbsences: number;
  ferie: number;
  malattia: number;
  permessi: number;
  altro: number;
};

type SelectedCell = {
  userId: string;
  userName: string;
  date: string;
  existing: AttendanceRecord | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMonthRange(offset = 0): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  // Date.UTC evita lo shift del fuso orario (Italia UTC+2)
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return { from: toISODate(first), to: toISODate(last) };
}

function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const diffMon = day === 0 ? -6 : 1 - day;
  // Costruiamo le date in UTC per evitare shift di fuso
  const monUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + diffMon);
  const sunUTC = monUTC + 6 * 86400000;
  return { from: toISODate(new Date(monUTC)), to: toISODate(new Date(sunUTC)) };
}

function generateDates(from: string, to: string): Date[] {
  const dates: Date[] = [];
  const cur = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function formatHours(h: number): string {
  if (h === 0) return "0h";
  const intPart = Math.floor(h);
  const dec = h - intPart;
  return dec > 0 ? `${intPart}.${Math.round(dec * 10)}h` : `${intPart}h`;
}

const REASON_LABEL: Record<string, string> = {
  MALATTIA: "Malattia",
  FERIE: "Ferie",
  PERMESSO: "Permesso",
  ALTRO: "Altro",
};

// ---------------------------------------------------------------------------
// Cell Component
// ---------------------------------------------------------------------------
function AttendanceCell({
  record,
  onClick,
}: {
  record: AttendanceRecord | null;
  onClick: () => void;
}) {
  if (!record) {
    return (
      <button
        onClick={onClick}
        className="w-full h-full min-h-[52px] flex items-center justify-center text-gray-600 hover:bg-gray-700/50 hover:text-gray-400 transition text-xs rounded cursor-pointer"
      >
        –
      </button>
    );
  }

  if (record.status === "PRESENTE") {
    return (
      <button
        onClick={onClick}
        className="w-full h-full min-h-[52px] flex flex-col items-center justify-center gap-0.5 hover:opacity-80 transition rounded cursor-pointer"
      >
        <span className="text-green-400 font-bold text-sm">✓</span>
        <span className="text-green-300 text-[10px] print:text-[9px]">{formatHours(record.hoursWorked)}</span>
      </button>
    );
  }

  if (record.status === "PARZIALE") {
    return (
      <button
        onClick={onClick}
        className="w-full h-full min-h-[52px] flex flex-col items-center justify-center gap-0.5 hover:opacity-80 transition rounded cursor-pointer"
      >
        <span className="text-amber-400 font-bold text-sm">P</span>
        <span className="text-amber-300 text-[10px] print:text-[9px]">{formatHours(record.hoursWorked)}</span>
      </button>
    );
  }

  // ASSENTE
  return (
    <button
      onClick={onClick}
      className="w-full h-full min-h-[52px] flex flex-col items-center justify-center gap-0.5 hover:opacity-80 transition rounded cursor-pointer"
    >
      <span className="text-red-400 font-bold text-sm">A</span>
      <span className="text-red-300 text-[10px] print:text-[9px]">
        {record.reason ? REASON_LABEL[record.reason] : ""}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AttendanceClient() {
  const defaultRange = getMonthRange();
  const [viewMode, setViewMode] = useState<"month" | "week" | "custom">("month");
  const [monthOffset, setMonthOffset] = useState(0);
  const [customFrom, setCustomFrom] = useState(defaultRange.from);
  const [customTo, setCustomTo] = useState(defaultRange.to);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [operators, setOperators] = useState<OperatorData[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  // Compute range from view mode
  useEffect(() => {
    if (viewMode === "month") {
      const r = getMonthRange(monthOffset);
      setFrom(r.from);
      setTo(r.to);
    } else if (viewMode === "week") {
      const r = getWeekRange();
      setFrom(r.from);
      setTo(r.to);
    } else {
      setFrom(customFrom);
      setTo(customTo);
    }
  }, [viewMode, monthOffset, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    if (!from || !to) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tl/attendance?from=${from}&to=${to}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
        setGlobalStats(data.globalStats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dates = generateDates(from, to);

  const handleCellClick = (op: OperatorData, date: Date) => {
    const dateStr = toISODate(date);
    const existing = op.attendances.find((a) => a.date.startsWith(dateStr)) || null;
    setSelectedCell({ userId: op.id, userName: op.name, date: dateStr, existing });
  };

  const handlePrint = () => window.print();

  const monthLabel = () => {
    const r = getMonthRange(monthOffset);
    const d = new Date(r.from + "T00:00:00Z");
    return d.toLocaleString("it-IT", { month: "long", year: "numeric" });
  };

  return (
    <div className="p-6 print:p-0">
      {/* ── HEADER / FILTRI ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Gestione Presenze</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode buttons */}
          {(["week", "month", "custom"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition border ${
                viewMode === mode
                  ? "bg-cyan-700 border-cyan-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {mode === "week" ? "Settimana" : mode === "month" ? "Mese" : "Personalizzato"}
            </button>
          ))}

          {/* Month navigation */}
          {viewMode === "month" && (
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1">
              <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1 hover:text-white text-gray-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white capitalize min-w-[120px] text-center">{monthLabel()}</span>
              <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1 hover:text-white text-gray-400">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Custom range inputs */}
          {viewMode === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1"
              />
            </div>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg border border-gray-600 transition"
          >
            <Printer className="w-4 h-4" />
            Stampa
          </button>
        </div>
      </div>

      {/* ── RIEPILOGO STATISTICHE ────────────────────────────────────── */}
      {globalStats && (
        <div className="flex flex-wrap gap-4 mb-6 print:mb-4">
          <div className="bg-gray-800 print:bg-gray-100 border border-gray-700 print:border-gray-300 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-400 print:text-gray-600 uppercase font-semibold mb-0.5">Ore Lavorate</div>
            <div className="text-2xl font-bold text-cyan-400 print:text-cyan-700">{formatHours(globalStats.totalHours)}</div>
          </div>
          <div className="bg-gray-800 print:bg-gray-100 border border-gray-700 print:border-gray-300 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-400 print:text-gray-600 uppercase font-semibold mb-0.5">Presenze</div>
            <div className="text-2xl font-bold text-green-400 print:text-green-700">{globalStats.presenti}</div>
          </div>
          <div className="bg-gray-800 print:bg-gray-100 border border-gray-700 print:border-gray-300 rounded-xl px-4 py-3">
            <div className="text-xs text-gray-400 print:text-gray-600 uppercase font-semibold mb-1">Assenze Totali</div>
            <div className="text-2xl font-bold text-red-400 print:text-red-700">{globalStats.totalAbsences}</div>
            <div className="text-[10px] text-gray-400 print:text-gray-600 mt-1">
              Ferie: {globalStats.ferie} · Malattia: {globalStats.malattia} · Permessi: {globalStats.permessi}
              {globalStats.altro > 0 && ` · Altro: ${globalStats.altro}`}
            </div>
          </div>
        </div>
      )}

      {/* ── TABELLA CALENDARIO ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Caricamento...</div>
      ) : (
        <>
          <div className="overflow-x-auto print:hidden">
            <table className="text-left border-collapse w-full" style={{ minWidth: `${200 + dates.length * 48}px` }}>
              <thead>
                <tr className="bg-gray-950 border-b border-gray-800 text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                  <th className="px-3 py-2 w-36 sticky left-0 bg-gray-950 z-10">Operatore</th>
                  {dates.map((d) => {
                    const weekend = isWeekend(d);
                    return (
                      <th
                        key={d.toISOString()}
                        className={`px-1 py-2 text-center w-12 ${weekend ? "bg-gray-900/60" : ""}`}
                      >
                        <div>{String(d.getUTCDate()).padStart(2, "0")}</div>
                        <div className="text-gray-500">{DAY_SHORT[d.getUTCDay()]}</div>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-center text-cyan-400 whitespace-nowrap">Ore Tot.</th>
                  <th className="px-2 py-2 text-center text-amber-400">Ferie</th>
                  <th className="px-2 py-2 text-center text-red-400">Malattia</th>
                  <th className="px-2 py-2 text-center text-purple-400">Permessi</th>
                  <th className="px-2 py-2 text-center text-red-500 whitespace-nowrap">Ass. Tot.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {operators.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-3 py-1 font-semibold text-white sticky left-0 bg-gray-900 z-10 text-sm">
                      {op.name}
                    </td>
                    {dates.map((d) => {
                      const dateStr = toISODate(d);
                      const record = op.attendances.find((a) => a.date.startsWith(dateStr)) || null;
                      const weekend = isWeekend(d);
                      return (
                        <td
                          key={d.toISOString()}
                          className={`p-0 border-l border-gray-800 ${weekend ? "bg-gray-900/40" : ""}`}
                        >
                          <AttendanceCell record={record} onClick={() => handleCellClick(op, d)} />
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center text-cyan-300 font-bold">{formatHours(op.stats.totalHours)}</td>
                    <td className="px-2 py-1 text-center text-amber-300">{op.stats.ferie || "–"}</td>
                    <td className="px-2 py-1 text-center text-red-300">{op.stats.malattia || "–"}</td>
                    <td className="px-2 py-1 text-center text-purple-300">{op.stats.permessi || "–"}</td>
                    <td className="px-2 py-1 text-center text-red-400 font-semibold">{op.stats.totalAbsences || "–"}</td>
                  </tr>
                ))}
                {operators.length === 0 && (
                  <tr>
                    <td colSpan={dates.length + 6} className="text-center py-12 text-gray-500">
                      Nessun operatore trovato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── STAMPA ANALITICA (SOLO PRINT) ───────────────────────────── */}
          <div className="hidden print:block space-y-6 mt-4">
            <h2 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2">
              Report Analitico Presenze: {new Date(from).toLocaleDateString("it-IT")} - {new Date(to).toLocaleDateString("it-IT")}
            </h2>
            {operators.map((op) => (
              <div key={op.id} className="break-inside-avoid border border-gray-300 rounded-lg p-4 mb-4 bg-white">
                <div className="flex justify-between items-end border-b border-gray-200 pb-2 mb-3">
                  <h3 className="text-base font-bold text-black">{op.name}</h3>
                  <div className="text-xs text-gray-700 flex gap-4">
                    <span>Ore Totali: <strong className="text-black">{formatHours(op.stats.totalHours)}</strong></span>
                    <span>Ferie: <strong>{op.stats.ferie}</strong></span>
                    <span>Malattia: <strong>{op.stats.malattia}</strong></span>
                    <span>Permessi: <strong>{op.stats.permessi}</strong></span>
                  </div>
                </div>
                
                {op.attendances.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Nessuna registrazione in questo periodo.</p>
                ) : (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="py-1 px-2 border-b border-gray-200 w-32">Data</th>
                        <th className="py-1 px-2 border-b border-gray-200 w-24">Stato</th>
                        <th className="py-1 px-2 border-b border-gray-200 w-24">Ore</th>
                        <th className="py-1 px-2 border-b border-gray-200">Motivo / Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {op.attendances.map((record) => {
                        const d = new Date(record.date);
                        const dateStr = d.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
                        return (
                          <tr key={record.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-1.5 px-2 capitalize">{dateStr}</td>
                            <td className="py-1.5 px-2 font-medium">
                              {record.status === "PRESENTE" && <span className="text-green-700">Presente</span>}
                              {record.status === "PARZIALE" && <span className="text-amber-700">Parziale</span>}
                              {record.status === "ASSENTE" && <span className="text-red-700">Assente</span>}
                            </td>
                            <td className="py-1.5 px-2">
                              {formatHours(record.hoursWorked)} {record.status === "PARZIALE" && <span className="text-gray-400">/ {formatHours(record.plannedHours)}</span>}
                            </td>
                            <td className="py-1.5 px-2 text-gray-600">
                              {record.reason ? REASON_LABEL[record.reason] : ""}
                              {record.customReason ? (record.reason ? ` - ${record.customReason}` : record.customReason) : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MODAL ────────────────────────────────────────────────────── */}
      {selectedCell && (
        <AttendanceModal
          userId={selectedCell.userId}
          userName={selectedCell.userName}
          date={selectedCell.date}
          existing={selectedCell.existing}
          onClose={() => setSelectedCell(null)}
          onSaved={() => { setSelectedCell(null); fetchData(); }}
          onDeleted={() => { setSelectedCell(null); fetchData(); }}
        />
      )}
    </div>
  );
}
