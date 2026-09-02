"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface HistoricalApptModalProps {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HistoricalApptModal({ contactId, contactName, onClose, onSuccess }: HistoricalApptModalProps) {
  const [histDate, setHistDate] = useState("");
  const [histOutcome, setHistOutcome] = useState("VENDUTO");
  const [histComm, setHistComm] = useState("");
  const [commerciali, setCommerciali] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/users?role=COMMERCIALE')
      .then(res => res.json())
      .then(data => setCommerciali(data.users || []));
  }, []);

  const handleSubmit = async () => {
    if (!histDate || !histComm) {
      toast.error("Compila tutti i campi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tl/appointments/historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          date: histDate,
          commercialeId: histComm,
          outcomeFinal: histOutcome
        })
      });
      if (!res.ok) {
        const e = await res.json();
        toast.error(e.error || "Errore");
        setLoading(false);
        return;
      }
      toast.success("Appuntamento Storico salvato!");
      onSuccess();
    } catch (e) {
      toast.error("Errore di rete");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl border border-blue-500 w-full max-w-md p-6 shadow-2xl relative">
        <h3 className="text-xl font-bold text-white mb-4">Appuntamento Storico</h3>
        <p className="text-gray-400 text-sm mb-4">
          Stai inserendo un appuntamento pregresso per <strong>{contactName}</strong>.
        </p>
        
        <div className="space-y-4 mb-6 text-left">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Commerciale</label>
            <select value={histComm} onChange={e=>setHistComm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white">
              <option value="">Seleziona...</option>
              {commerciali.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Data</label>
            <input type="date" value={histDate} onChange={e=>setHistDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Esito</label>
            <select value={histOutcome} onChange={e=>setHistOutcome(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white">
              <option value="VENDUTO">Venduto</option>
              <option value="KO">KO</option>
              <option value="FOLLOWUP">Follow-up</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 w-full">
          <button 
            disabled={loading}
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Annulla
          </button>
          <button 
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            {loading ? "Salvataggio..." : "Salva Storico"}
          </button>
        </div>
      </div>
    </div>
  );
}
