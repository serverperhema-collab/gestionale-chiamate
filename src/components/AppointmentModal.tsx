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

  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  const [slots, setSlots] = useState<{ time: string, year: number, month: number, day: number, hour: number, minute: number }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ time: string, year: number, month: number, day: number, hour: number, minute: number } | null>(null);

  const [isDeroga, setIsDeroga] = useState(false);
  const [derogaTime, setDerogaTime] = useState("");
  const [derogaDate, setDerogaDate] = useState("");

  const [referents, setReferents] = useState<{ name: string; role: string; phone: string }[]>([
    { name: initialReferentName, role: "", phone: initialPhone }
  ]);

  const [formData, setFormData] = useState({
    email: initialEmail,
    clientNeeds: ""
  });

  const [submitting, setSubmitting] = useState(false);

  const [derogaStats, setDerogaStats] = useState<{
    maxDeroghe: number;
    maxDerogheHours: number;
    usedDeroghe: number;
    remainingDeroghe: number;
  } | null>(null);

  useEffect(() => {
    // Fetch delle statistiche sulle deroghe all'apertura del modal
    const fetchDerogaStats = async () => {
      try {
        const res = await fetch('/api/appointments/deroga-stats');
        if (res.ok) {
          const data = await res.json();
          setDerogaStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch deroga stats", e);
      }
    };
    fetchDerogaStats();
  }, []);

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
        const res = await fetch(`/api/appointments/dates?cap=${searchCap}`);
        const data = await res.json();
        if (res.ok) {
          setAvailableAgendas(data.agendas);
          // Auto select if only 1 agenda
          if (data.agendas.length === 1) {
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
    
    // Piccolo debounce per non spammare richieste mentre l'utente digita
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
        toast.error(data.error || "Nessuna disponibilitÃ ");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

        let finalDate = "";
    
    if (isDeroga) {
      if (!derogaTime || !derogaDate) {
        toast.error("Specifica data e orario per la deroga");
        return;
      }
      const [yearStr, monthStr, dayStr] = derogaDate.split("-");
      const [hourStr, minStr] = derogaTime.split(":");
      // Costruiamo una data locale nel browser (che è già nel fuso orario giusto) e prendiamo l'ISO string
      finalDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), parseInt(hourStr), parseInt(minStr), 0).toISOString();
    } else {
      if (!selectedSlot) {
        toast.error("Seleziona uno slot orario");
        return;
      }
      // Costruiamo la data locale dallo slot
      finalDate = new Date(selectedSlot.year, selectedSlot.month - 1, selectedSlot.day, selectedSlot.hour, selectedSlot.minute, 0).toISOString();
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          date: finalDate,
          isDeroga,
          zoneAgendaId: isDeroga ? null : selectedAgenda?.id,
          referentName: referents.map(r => r.name).join(", "),
          referentRole: referents[0]?.role || "Multipli",
          phone: referents[0]?.phone || "",
          email: formData.email,
          clientNeeds: formData.clientNeeds
        })
      });

      if (res.ok) {
        toast.success(isDeroga ? "Appuntamento inviato in approvazione (Deroga)!" : "Appuntamento fissato con successo!");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore nel salvataggio");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-700 flex flex-col max-h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-400" /> Fissa Appuntamento
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Sinistra: Calendario e Slot */}
            <div className="space-y-6">

              {/* CAP Ricerca */}
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <label className="block text-sm font-semibold text-gray-300 mb-2">CAP di Riferimento</label>
                <input
                  type="text"
                  value={searchCap}
                  onChange={(e) => setSearchCap(e.target.value.slice(0, 5))}
                  maxLength={5}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-lg tracking-widest font-mono"
                  placeholder="Inserisci CAP..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Verifica in automatico le agende per questo CAP. Modificalo se il cliente vuole l'appuntamento in un'altra sede.
                </p>
              </div>
              
              {/* Date disponibili */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1.5" /> Seleziona un'Agenda per il CAP {searchCap}
                </h3>
                
                {searchCap.length < 5 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Inserisci un CAP valido di 5 cifre...</div>
                ) : loadingAgendas ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Caricamento agende in corso...</div>
                ) : availableAgendas.length === 0 ? (
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-red-400 text-sm font-medium">Nessuna agenda aperta per questo CAP.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {availableAgendas.map((agenda, i) => {
                        const dateObj = new Date(agenda.date);
                        const isSelected = selectedAgenda?.id === agenda.id;
                        return (
                          <button
                            key={agenda.id}
                            type="button"
                            onClick={() => handleSelectAgenda(agenda)}
                            className={`py-2 px-3 rounded text-sm font-medium transition text-left flex flex-col ${
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
              {selectedAgenda && !isDeroga && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 animate-in fade-in zoom-in-95">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" /> Orari per {new Date(selectedAgenda.date).toLocaleDateString('it-IT')}
                  </h3>
                  
                  {loadingSlots ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Ricerca disponibilitÃ ...</div>
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

              {/* Form Deroga Manuale */}
              {isDeroga ? (
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-700/50 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Appuntamento in Deroga
                  </h3>
                  <div className="text-xs text-red-300/80 mb-4 space-y-2">
                    <p>
                      Stai inserendo un appuntamento <strong>fuori dalle agende previste</strong>. Il sistema ti consente di forzare qualsiasi data e ora, ma tieni presente che:
                    </p>
                    <ul className="list-disc pl-4">
                      <li>Le deroghe bypassano la logica delle zone.</li>
                      <li>Vengono conteggiate in un budget limitato assegnato dal tuo Team Leader.</li>
                      <li>Sono sempre subordinate ad approvazione.</li>
                    </ul>
                    {derogaStats && (
                      <p className={`font-semibold mt-2 px-2 py-1 inline-block rounded ${derogaStats.remainingDeroghe > 0 ? 'bg-red-900/50 text-red-200' : 'bg-red-600 text-white'}`}>
                        Budget residuo: hai {derogaStats.remainingDeroghe} deroghe disponibili su {derogaStats.maxDeroghe} (nelle ultime {derogaStats.maxDerogheHours}h).
                      </p>
                    )}
                  </div>
                  
                  {derogaStats?.remainingDeroghe === 0 ? (
                    <div className="bg-red-900/40 p-3 rounded border border-red-600 text-red-200 text-sm font-medium mb-3">
                      Non puoi piÃ¹ inserire appuntamenti in deroga. Hai raggiunto il limite massimo. Attendi o contatta il tuo Team Leader.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Data</label>
                        <input
                          type="date"
                          value={derogaDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setDerogaDate(e.target.value)}
                          className="w-full bg-gray-900 border border-red-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                          required={isDeroga}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Orario</label>
                        <input
                          type="time"
                          value={derogaTime}
                          onChange={(e) => setDerogaTime(e.target.value)}
                          className="w-full bg-gray-900 border border-red-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                          required={isDeroga}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsDeroga(false)}
                    className="mt-4 text-xs text-gray-400 hover:text-white underline w-full text-center"
                  >
                    Annulla Deroga e torna alle date disponibili
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => { setSelectedSlot(null); setSlots([]); setIsDeroga(true); }}
                    className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center transition underline underline-offset-2"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    NON RIESCI A TROVARE UNA DATA PER IL CLIENTE? INSERISCI APP IN DEROGA
                  </button>
                </div>
              )}
            </div>

            {/* Destra: Form Scheda */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Scheda Commerciale</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400">Referenti Aziendali (da 1 a 5) *</span>
                  {referents.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setReferents([...referents, { name: "", role: "", phone: "" }])}
                      className="text-[10px] bg-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-0.5 rounded border border-blue-500/30 transition font-semibold"
                    >
                      + Aggiungi Referente
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {referents.map((ref, idx) => (
                    <div key={idx} className="p-3 bg-gray-900/60 rounded-lg border border-gray-700 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Referente #{idx + 1}</span>
                        {referents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setReferents(referents.filter((_, i) => i !== idx))}
                            className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-500 uppercase font-bold mb-0.5">Nome *</label>
                          <input
                            type="text"
                            value={ref.name}
                            onChange={(e) => {
                              const updated = [...referents];
                              updated[idx].name = e.target.value;
                              setReferents(updated);
                            }}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 uppercase font-bold mb-0.5">Ruolo *</label>
                          <input
                            type="text"
                            value={ref.role}
                            onChange={(e) => {
                              const updated = [...referents];
                              updated[idx].role = e.target.value;
                              setReferents(updated);
                            }}
                            placeholder="Titolare"
                            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 uppercase font-bold mb-0.5">Tel. Diretto *</label>
                          <input
                            type="text"
                            value={ref.phone}
                            onChange={(e) => {
                              const updated = [...referents];
                              updated[idx].phone = e.target.value;
                              setReferents(updated);
                            }}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Email di Riferimento (Opzionale)</label>
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
                  rows={3}
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
              disabled={submitting || (!selectedSlot && !isDeroga) || (isDeroga && derogaStats?.remainingDeroghe === 0)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
            >
              {submitting ? 'Salvataggio...' : 'Conferma Appuntamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

