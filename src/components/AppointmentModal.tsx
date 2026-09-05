"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface AppointmentModalProps {
  contactId: string;
  cap: string;
  initialReferentName?: string;
  initialPhone?: string;
  initialEmail?: string;
  isSecondAppt?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentModal({ 
  contactId, 
  cap, 
  initialReferentName = "",
  initialPhone = "",
  initialEmail = "",
  isSecondAppt = false,
  onClose, 
  onSuccess 
}: AppointmentModalProps) {
  const [searchCap, setSearchCap] = useState(cap);
  const [availableAgendas, setAvailableAgendas] = useState<any[]>([]);
  const [loadingAgendas, setLoadingAgendas] = useState(true);

  const [selectedAgenda, setSelectedAgenda] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    referentName: initialReferentName,
    phone: initialPhone,
    email: initialEmail,
    clientNeeds: ""
  });
  
  const [isDeroga, setIsDeroga] = useState(isSecondAppt);
  const [derogaDate, setDerogaDate] = useState("");
  const [isPhoneAppt, setIsPhoneAppt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAgendas() {
      if (searchCap.length < 5) return;
      setLoadingAgendas(true);
      try {
        const res = await fetch(`/api/agendas/by-cap?cap=${searchCap}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableAgendas(data.agendas || []);
        }
      } catch (e) {
        console.error("Errore fetch agende:", e);
      } finally {
        setLoadingAgendas(false);
      }
    }
    fetchAgendas();
  }, [searchCap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referentName || !formData.phone) {
      return toast.error("Nome referente e telefono sono obbligatori");
    }

    let finalDate = "";
    if (isDeroga || isPhoneAppt) {
      if (!derogaDate) return toast.error("Seleziona data e ora");
      finalDate = new Date(derogaDate).toISOString();
    } else {
      if (!selectedSlot) return toast.error("Seleziona uno slot orario");
      finalDate = new Date(selectedSlot.year, selectedSlot.month - 1, selectedSlot.day, selectedSlot.hour, selectedSlot.minute, 0).toISOString();
    }

    setSubmitting(true);
    try {
      // 1. Crea o recupera ST
      const stRes = await fetch("/api/trattative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId })
      });
      if (!stRes.ok) throw new Error("Errore inizializzazione ST");
      const { trattativa } = await stRes.json();

      // 2. Azione appuntamento o deroga
      const action = isDeroga ? "deroga" : "appuntamento";
      const payload = isDeroga 
        ? { requestedDate: finalDate, notes: formData.clientNeeds }
        : {
            date: finalDate,
            isPhoneAppt,
            zoneAgendaId: isPhoneAppt ? undefined : selectedAgenda?.id,
            referentName: formData.referentName,
            phone: formData.phone,
            clientNeeds: formData.clientNeeds
          };

      const actionRes = await fetch(`/api/trattative/${trattativa.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });

      if (actionRes.ok) {
        toast.success(isDeroga ? "Deroga richiesta con successo!" : "Appuntamento fissato con successo!");
        onSuccess();
        onClose();
      } else {
        const data = await actionRes.json();
        toast.error(data.error || "Errore nel salvataggio");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Fissa Appuntamento</h2>
            <p className="text-gray-400 text-sm mt-1">{isSecondAppt ? "Secondo Appuntamento (Richiesta Deroga)" : "Nuovo Incontro"}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center text-sm font-semibold text-gray-300">
              <input type="checkbox" checked={isDeroga} onChange={(e) => setIsDeroga(e.target.checked)} disabled={isSecondAppt} className="mr-2 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/20" />
              Richiedi Deroga (Forza fuori Agenda)
            </label>
            <label className="flex items-center text-sm font-semibold text-gray-300">
              <input type="checkbox" checked={isPhoneAppt} onChange={(e) => setIsPhoneAppt(e.target.checked)} className="mr-2 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500/20" />
              Appuntamento Telefonico
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-white border-b border-gray-800 pb-2">Dati Referente</h3>
              <input type="text" placeholder="Nome Referente *" value={formData.referentName} onChange={(e) => setFormData({...formData, referentName: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white" required />
              <input type="text" placeholder="Telefono *" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white" required />
              <input type="email" placeholder="Email (Opzionale)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white" />
              <textarea placeholder="Note per il commerciale / Esigenze cliente..." value={formData.clientNeeds} onChange={(e) => setFormData({...formData, clientNeeds: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white min-h-[100px]" />
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-white border-b border-gray-800 pb-2">Data e Ora</h3>
              {(isDeroga || isPhoneAppt) ? (
                <div className="p-4 bg-gray-950 border border-gray-700 rounded-xl">
                  <label className="block text-sm text-gray-400 mb-2">Seleziona Data e Ora Libera</label>
                  <input type="datetime-local" value={derogaDate} onChange={(e) => setDerogaDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white" required={isDeroga || isPhoneAppt} />
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="text" value={searchCap} onChange={(e) => setSearchCap(e.target.value)} maxLength={5} placeholder="Filtra Agende per CAP..." className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white font-mono tracking-widest" />
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {loadingAgendas ? <p className="text-gray-500 text-sm">Caricamento...</p> : availableAgendas.length === 0 ? <p className="text-red-400 text-sm">Nessuna agenda trovata.</p> : availableAgendas.map(agenda => (
                      <div key={agenda.id} className="p-3 bg-gray-800 rounded-xl border border-gray-700 cursor-pointer hover:bg-gray-700" onClick={() => { setSelectedAgenda(agenda); /* Slot logic should be here, simplified for now */ setSelectedSlot({ year: new Date(agenda.date).getFullYear(), month: new Date(agenda.date).getMonth() + 1, day: new Date(agenda.date).getDate(), hour: 10, minute: 0 }); }}>
                        <div className="font-bold text-white">{new Date(agenda.date).toLocaleDateString()} - {agenda.name}</div>
                        <div className="text-sm text-gray-400">Clicca per selezionare (Slot fisso alle 10:00 per simularlo)</div>
                      </div>
                    ))}
                  </div>
                  {selectedAgenda && <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-xl text-blue-400 text-sm">Agenda selezionata: {selectedAgenda.name} (10:00)</div>}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 font-bold hover:text-white">Annulla</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center">
              {submitting ? "Salvataggio..." : (isDeroga ? "Richiedi Deroga" : "Conferma Appuntamento")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}