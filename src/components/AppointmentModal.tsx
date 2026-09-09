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
  const [slots, setSlots] = useState<{ time: string, year: number, month: number, day: number, hour: number, minute: number }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    referentName: initialReferentName,
    referentRole: "",
    phone: initialPhone,
    email: initialEmail,
    clientNeeds: ""
  });
  
  const [isDeroga, setIsDeroga] = useState(isSecondAppt);
  const [derogaTime, setDerogaTime] = useState("");
  const [derogaDate, setDerogaDate] = useState("");
  const [isPhoneAppt, setIsPhoneAppt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Aggiorna le agende disponibili quando cambia searchCap (almeno 5 caratteri)
  useEffect(() => {
    if (searchCap.length < 5) {
      setAvailableAgendas([]);
      setLoadingAgendas(false);
      return;
    }

    const fetchAgendas = async () => {
      setLoadingAgendas(true);
      setSelectedAgenda(null);
      setSlots([]);
      setSelectedSlot(null);
      setIsDeroga(false);
      try {
        const res = await fetch(`/api/agendas/by-cap?cap=${searchCap}`);
        const data = await res.json();
        if (res.ok) {
          setAvailableAgendas(data.agendas || []);
          // Auto select if only 1 agenda
          if (data.agendas && data.agendas.length === 1) {
            handleSelectAgenda(data.agendas[0]);
          }
        } else {
          toast.error("Errore nel caricamento delle agende disponibili");
        }
      } catch (e) {
        toast.error("Errore di rete durante il caricamento agende");
      } finally {
        setLoadingAgendas(false);
      }
    };
    
    const timer = setTimeout(fetchAgendas, 500);
    return () => clearTimeout(timer);
  }, [searchCap]);

  const handleSelectAgenda = async (agenda: any) => {
    setSelectedAgenda(agenda);
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    setIsDeroga(false);

    try {
      const res = await fetch(`/api/appointments/slots?agendaId=${agenda.id}`);
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots);
      } else {
        toast.error(data.error || "Nessuna disponibilità");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referentName || !formData.phone) {
      return toast.error("Nome referente e telefono sono obbligatori");
    }

    let finalDate = "";
    
    if (isDeroga || isPhoneAppt) {
      if (!derogaDate) return toast.error("Seleziona la data");
      // If it's a phone appt, we might not need time, but let's assume we do or default to 00:00
      const dTime = derogaTime || "09:00"; 
      const [yearStr, monthStr, dayStr] = derogaDate.split("-");
      const [hourStr, minStr] = dTime.split(":");
      finalDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), parseInt(hourStr), parseInt(minStr), 0).toISOString();
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

      // 2. Azione appuntamento
      // Use standard appuntamento endpoint
      const action = isDeroga ? "deroga" : "appuntamento";
      const payload = isDeroga 
        ? { requestedDate: finalDate, notes: formData.clientNeeds }
        : {
            date: finalDate,
            isPhoneAppt,
            zoneAgendaId: isPhoneAppt ? undefined : selectedAgenda?.id,
            referentName: formData.referentName,
            referentRole: formData.referentRole || "Referente",
            phone: formData.phone,
            email: formData.email,
            clientNeeds: formData.clientNeeds
          };

      const actionRes = await fetch(`/api/trattative/${trattativa.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });

      if (!actionRes.ok) {
        const errorData = await actionRes.json();
        throw new Error(errorData.error || "Errore salvataggio azione");
      }

      toast.success(isDeroga ? "Deroga richiesta con successo!" : "Appuntamento fissato con successo!");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Si è verificato un errore");
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
              <h3 className="font-bold text-white border-b border-gray-800 pb-2 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" /> Date e Orari
              </h3>

              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                {(isDeroga || isPhoneAppt) ? (
                  <div>
                    <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1.5" /> 
                      {isPhoneAppt ? "Appuntamento Telefonico" : "Appuntamento in Deroga"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Data</label>
                        <input
                          type="date"
                          value={derogaDate}
                          min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())}
                          onChange={(e) => setDerogaDate(e.target.value)}
                          className="w-full bg-gray-900 border border-amber-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                          required={(isDeroga || isPhoneAppt)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Orario</label>
                        <input
                          type="time"
                          value={derogaTime}
                          onChange={(e) => setDerogaTime(e.target.value)}
                          className="w-full bg-gray-900 border border-amber-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                          required={(isDeroga || isPhoneAppt)}
                        />
                      </div>
                    </div>
                    
                    {!isPhoneAppt && (
                      <button
                        type="button"
                        onClick={() => setIsDeroga(false)}
                        className="mt-4 text-xs text-gray-400 hover:text-white underline w-full text-center"
                      >
                        Annulla Deroga e torna alle date disponibili
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input type="text" value={searchCap} onChange={(e) => setSearchCap(e.target.value)} maxLength={5} placeholder="Filtra Agende per CAP..." className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white font-mono tracking-widest" />
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {loadingAgendas ? <p className="text-gray-500 text-sm">Caricamento...</p> : availableAgendas.length === 0 ? <p className="text-red-400 text-sm">Nessuna agenda trovata.</p> : availableAgendas.map(agenda => {
                        const dateObj = new Date(agenda.date);
                        const isSelected = selectedAgenda?.id === agenda.id;
                        return (
                          <button
                            key={agenda.id}
                            type="button"
                            onClick={() => handleSelectAgenda(agenda)}
                            className={`w-full py-2 px-3 rounded text-sm font-medium transition text-left flex flex-col ${
                              isSelected
                                ? 'bg-blue-600 text-white border border-blue-500 shadow-md' 
                                : 'bg-gray-900 text-gray-300 hover:bg-gray-700 border border-gray-600'
                            }`}
                          >
                            <span className="font-bold text-xs truncate w-full mb-1 text-blue-200">{agenda.name}</span>
                            <div className="flex items-baseline space-x-1">
                              <span className="capitalize">{dateObj.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                              <span className="font-bold text-base">{dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Slot orari */}
              {selectedAgenda && !isDeroga && !isPhoneAppt && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 animate-in fade-in zoom-in-95">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" /> Orari per {new Date(selectedAgenda.date).toLocaleDateString('it-IT')}
                  </h3>
                  
                  {loadingSlots ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Ricerca disponibilità...</div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-red-400 text-sm font-medium">Tutti gli slot per questa giornata sono occupati o bloccati.</p>
                      <button 
                        type="button" 
                        onClick={() => setIsDeroga(true)}
                        className="mt-3 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition"
                      >
                        Forza in Deroga
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSelectedSlot(s); setIsDeroga(false); }}
                          className={`py-1.5 px-2 rounded text-sm font-medium transition ${
                            selectedSlot?.time === s.time && !isDeroga
                              ? 'bg-blue-600 text-white shadow-md border border-blue-500' 
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                          }`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Destra: Form Scheda */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Scheda Commerciale</h3>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome Referente *</label>
                <input
                  type="text"
                  value={formData.referentName}
                  onChange={(e) => setFormData({...formData, referentName: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ruolo Referente *</label>
                <input
                  type="text"
                  value={formData.referentRole}
                  onChange={(e) => setFormData({...formData, referentRole: e.target.value})}
                  placeholder="Es. Titolare, Responsabile Acquisti"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Telefono Diretto *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Email Referente</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Esigenze del Cliente (Note per Commerciale) *</label>
                <textarea
                  value={formData.clientNeeds}
                  onChange={(e) => setFormData({...formData, clientNeeds: e.target.value})}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting || (!selectedSlot && !isDeroga && !isPhoneAppt)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
            >
              {submitting ? 'Salvataggio...' : (isDeroga ? 'Invia in Approvazione (Deroga)' : 'Conferma Appuntamento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
