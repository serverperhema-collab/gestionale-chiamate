"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

type AttendanceRecord = {
  id: string;
  status: "PRESENTE" | "PARZIALE" | "ASSENTE";
  shiftMorning: boolean;
  shiftAfternoon: boolean;
  plannedHours: number;
  hoursWorked: number;
  reason: "MALATTIA" | "FERIE" | "PERMESSO" | "ALTRO" | null;
  customReason: string | null;
};

type Props = {
  userId: string;
  userName: string;
  date: string;
  existing: AttendanceRecord | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

function computePlanned(morning: boolean, afternoon: boolean): number {
  if (morning && afternoon) return 7;
  if (morning) return 4;
  if (afternoon) return 3;
  return 0;
}

export default function AttendanceModal({ userId, userName, date, existing, onClose, onSaved, onDeleted }: Props) {
  const [status, setStatus] = useState<"PRESENTE" | "PARZIALE" | "ASSENTE">(existing?.status || "PRESENTE");
  const [morning, setMorning] = useState(existing?.shiftMorning ?? true);
  const [afternoon, setAfternoon] = useState(existing?.shiftAfternoon ?? true);
  const [hoursWorked, setHoursWorked] = useState(existing?.hoursWorked?.toString() || "");
  const [reason, setReason] = useState<string>(existing?.reason || "");
  const [customReason, setCustomReason] = useState(existing?.customReason || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const planned = computePlanned(morning, afternoon);

  // Quando cambia lo status, resetta alcuni campi per coerenza
  useEffect(() => {
    if (status === "PRESENTE") {
      setReason("");
      setCustomReason("");
    }
    if (status === "ASSENTE") {
      setHoursWorked("0");
    }
  }, [status]);

  const dateFormatted = new Date(date + "T00:00:00Z").toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/tl/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date,
          status,
          shiftMorning: morning,
          shiftAfternoon: afternoon,
          hoursWorked: parseFloat(hoursWorked) || 0,
          reason: reason || null,
          customReason: customReason.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Errore nel salvataggio");
      } else {
        toast.success("Presenza salvata");
        onSaved();
      }
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing?.id) return;
    if (!confirm("Eliminare questo record di presenza?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tl/attendance/${existing.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Presenza eliminata");
        onDeleted();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore nella cancellazione");
      }
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <div>
            <div className="font-bold text-white text-lg">{userName}</div>
            <div className="text-sm text-gray-400 capitalize">{dateFormatted}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Stato */}
          <div>
            <label className="block text-xs text-gray-400 uppercase font-semibold mb-2">Stato</label>
            <div className="flex gap-2">
              {(["PRESENTE", "PARZIALE", "ASSENTE"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border ${
                    status === s
                      ? s === "PRESENTE"
                        ? "bg-green-700 border-green-500 text-white"
                        : s === "PARZIALE"
                        ? "bg-amber-700 border-amber-500 text-white"
                        : "bg-red-800 border-red-600 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {s === "PRESENTE" ? "Presente" : s === "PARZIALE" ? "Parziale" : "Assente"}
                </button>
              ))}
            </div>
          </div>

          {/* Turni (PRESENTE o PARZIALE) */}
          {status !== "ASSENTE" && (
            <div>
              <label className="block text-xs text-gray-400 uppercase font-semibold mb-2">Turno</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={morning}
                    onChange={(e) => setMorning(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-white text-sm">Mattina 09:00 – 13:00 <span className="text-gray-400">(4h)</span></span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={afternoon}
                    onChange={(e) => setAfternoon(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-white text-sm">Pomeriggio 14:00 – 17:00 <span className="text-gray-400">(3h)</span></span>
                </label>
                <div className="text-xs text-gray-400 mt-1">
                  Ore previste: <span className="text-cyan-300 font-semibold">{planned}h</span>
                </div>
              </div>
            </div>
          )}

          {/* Ore effettive (solo PARZIALE) */}
          {status === "PARZIALE" && (
            <div>
              <label className="block text-xs text-gray-400 uppercase font-semibold mb-2">
                Ore Effettive <span className="text-gray-500">(deve essere tra 0 e {planned}h)</span>
              </label>
              <input
                type="number"
                min="0.5"
                max={planned - 0.5}
                step="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                className="w-32 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                placeholder="es. 2"
              />
            </div>
          )}

          {/* Motivo (ASSENTE o PARZIALE) */}
          {status !== "PRESENTE" && (
            <div>
              <label className="block text-xs text-gray-400 uppercase font-semibold mb-2">Motivo</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Seleziona --</option>
                <option value="FERIE">Ferie</option>
                <option value="MALATTIA">Malattia</option>
                <option value="PERMESSO">Permesso</option>
                <option value="ALTRO">Altro</option>
              </select>
            </div>
          )}

          {/* Note / Dettaglio (sempre se ASSENTE/PARZIALE; obbligatorio se ALTRO) */}
          {status !== "PRESENTE" && (
            <div>
              <label className="block text-xs text-gray-400 uppercase font-semibold mb-2">
                Note{reason === "ALTRO" && <span className="text-red-400 ml-1">*</span>}
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
                placeholder={reason === "ALTRO" ? "Specifica il motivo (obbligatorio)" : "Note aggiuntive (facoltativo)"}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
          <div>
            {existing && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg text-sm transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Elimino..." : "Elimina"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Salvo..." : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
