import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, User, Save, Phone } from "lucide-react";
import toast from "react-hot-toast";

export default function EditAppointmentModal({ appt, onClose, onSaved }: { appt: any, onClose: () => void, onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [commerciali, setCommerciali] = useState<any[]>([]);
  const [operatori, setOperatori] = useState<any[]>([]);

  // Form states
  const [date, setDate] = useState(new Date(appt.date).toISOString().slice(0, 16));
  const [commercialeId, setCommercialeId] = useState(appt.commercialeId || "");
  const [operatorId, setOperatorId] = useState(appt.operatorId || "");
  const [phone, setPhone] = useState(appt.phone || "");
  const [clientNeeds, setClientNeeds] = useState(appt.clientNeeds || "");

  useEffect(() => {
    fetch('/api/users?role=COMMERCIALE').then(r=>r.json()).then(d=>setCommerciali(d.users||[]));
    fetch('/api/users?role=OPERATORE').then(r=>r.json()).then(d=>setOperatori(d.users||[]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/tl/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          commercialeId,
          operatorId,
          phone,
          clientNeeds
        })
      });
      if (res.ok) {
        toast.success("Modificato con successo!");
        onSaved();
      } else {
        toast.error("Errore salvataggio");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900/80">
          <h2 className="text-xl font-bold text-white">Modifica Appuntamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data e Ora</label>
            <input type="datetime-local" required value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Commerciale Assegnato</label>
            <select value={commercialeId} onChange={e=>setCommercialeId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white">
              <option value="">Nessuno (Da Assegnare)</option>
              {commerciali.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Operatore (Fissatore)</label>
            <select value={operatorId} onChange={e=>setOperatorId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white">
              <option value="">Nessuno</option>
              {operatori.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefono (Specifico App.)</label>
            <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Esigenze Cliente</label>
            <textarea value={clientNeeds} onChange={e=>setClientNeeds(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white" />
          </div>

          <div className="pt-4 border-t border-gray-800 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition">Annulla</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition disabled:opacity-50">
              {loading ? "Salvataggio..." : "Salva Modifiche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
