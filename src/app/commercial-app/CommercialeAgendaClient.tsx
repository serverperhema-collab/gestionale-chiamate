"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Phone, User, FileText, CheckCircle, AlertTriangle, Printer, PhoneCall, RefreshCw, Handshake, XCircle, PauseCircle, Bell } from "lucide-react";
import toast from "react-hot-toast";
import OutcomeModal from "@/components/OutcomeModal";
import AppointmentModal from "@/components/AppointmentModal";
import { exportAgendaToPDF } from "@/lib/exportUtils";

type TabType =
  | "DA_SVOLGERE"
  | "SVOLTI_ESITATI"
  | "SVOLTI_DA_ESITARE"
  | "RICHIAMI_PERSONALI"
  | "RICHIAMI_OPERATORI"
  | "RICHIAMI_TL"
  | "TRATTATIVE_CORSO"
  | "TRATTATIVE_KO"
  | "STANDBY"
  | "CONTRATTI_FIRMATI"
  | "NOTIFICHE";

export default function CommercialeAgendaClient() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [fixApptContactInfo, setFixApptContactInfo] = useState<{ contactId: string; cap: string; referentName?: string; phone?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("DA_SVOLGERE");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/commerciale/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      } else {
        toast.error("Errore di caricamento appuntamenti");
      }
      const notifRes = await fetch("/api/commerciale/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getLatestOutcome = (a: any) => {
    if (!a.outcomes || a.outcomes.length === 0) return null;
    return a.outcomes[0];
  };

  const daSvolgere = appointments.filter(a => {
    if (a.status === "DONE" || (a.outcomes && a.outcomes.length > 0)) return false;
    if (a.status === "DA_GESTIRE_COMMERCIALE") return false;
    const d = new Date(a.date); d.setHours(0, 0, 0, 0);
    return d >= today;
  });

  const svoltiEsitati = appointments.filter(a => {
    if (a.status === "DA_GESTIRE_COMMERCIALE") return false;
    return a.status === "DONE" || (a.outcomes && a.outcomes.length > 0);
  });

  const svoltiDaEsitare = appointments.filter(a => {
    if (a.status === "DONE" || (a.outcomes && a.outcomes.length > 0)) return false;
    if (a.status === "DA_GESTIRE_COMMERCIALE") return false;
    const d = new Date(a.date); d.setHours(0, 0, 0, 0);
    return d < today;
  });

  const richiamiPersonali = appointments.filter(a => a.status === "DA_GESTIRE_COMMERCIALE");

  const richiamiOperatori = appointments.filter(a => {
    const o = getLatestOutcome(a);
    return o && o.nextActionType === "RICHIAMO" && o.nextActionTarget === "OPERATORE";
  });

  const richiamiTL = appointments.filter(a => {
    const o = getLatestOutcome(a);
    return o && o.nextActionType === "RICHIAMO" && o.nextActionTarget === "TEAM_LEADER";
  });

  const trattativeCorso = appointments.filter(a => {
    const cs = a.commercialStatus;
    return cs === "FOLLOW_UP" || cs === "PREVENTIVO_IN_CORSO";
  });

  const trattativeKO = appointments.filter(a => a.commercialStatus === "KO");

  const standby = appointments.filter(a => {
    const o = getLatestOutcome(a);
    return o && o.outcomeFinal === "STANDBY";
  });

  const contrattiFirmati = appointments.filter(a => {
    const o = getLatestOutcome(a);
    return o && o.outcomeFinal === "VENDUTO";
  });

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/commerciale/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const getDisplayedAppts = () => {
    switch (activeTab) {
      case "DA_SVOLGERE": return daSvolgere;
      case "SVOLTI_ESITATI": return svoltiEsitati;
      case "SVOLTI_DA_ESITARE": return svoltiDaEsitare;
      case "RICHIAMI_PERSONALI": return richiamiPersonali;
      case "RICHIAMI_OPERATORI": return richiamiOperatori;
      case "RICHIAMI_TL": return richiamiTL;
      case "TRATTATIVE_CORSO": return trattativeCorso;
      case "TRATTATIVE_KO": return trattativeKO;
      case "STANDBY": return standby;
      case "CONTRATTI_FIRMATI": return contrattiFirmati;
      default: return [];
    }
  };

  const displayedAppts = getDisplayedAppts();

  return (
    <div className="p-4 max-w-[1400px] mx-auto pb-12 flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)] relative">

      {/* MENU LATERALE */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-2 pb-8 custom-scrollbar">
        <h2 className="text-xl font-bold text-white mb-4 px-2">Dashboard</h2>

        <div className="space-y-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2 mt-2">Agenda</span>
          <TabButton id="DA_SVOLGERE" label="Da Svolgere" count={daSvolgere.length} active={activeTab} setActive={setActiveTab} color="bg-blue-600/20 text-blue-400 border-blue-500/50" />
          <TabButton id="SVOLTI_DA_ESITARE" label="Svolti DA Esitare" count={svoltiDaEsitare.length} active={activeTab} setActive={setActiveTab} color="bg-yellow-600/20 text-yellow-400 border-yellow-500/50" />
          <TabButton id="SVOLTI_ESITATI" label="Svolti Esitati" count={svoltiEsitati.length} active={activeTab} setActive={setActiveTab} color="bg-emerald-600/20 text-emerald-400 border-emerald-500/50" />
        </div>

        <div className="space-y-1 mt-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Gestione Richiami</span>
          <TabButton id="RICHIAMI_PERSONALI" label="Richiami Personali" count={richiamiPersonali.length} active={activeTab} setActive={setActiveTab} color="bg-indigo-600/20 text-indigo-400 border-indigo-500/50" />
          <TabButton id="RICHIAMI_OPERATORI" label="Assegnati a Op." count={richiamiOperatori.length} active={activeTab} setActive={setActiveTab} color="bg-purple-600/20 text-purple-400 border-purple-500/50" />
          <TabButton id="RICHIAMI_TL" label="Gestiti da TL" count={richiamiTL.length} active={activeTab} setActive={setActiveTab} color="bg-pink-600/20 text-pink-400 border-pink-500/50" />
        </div>

        <div className="space-y-1 mt-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Trattative</span>
          <TabButton id="TRATTATIVE_CORSO" label="In Corso (FollowUp)" count={trattativeCorso.length} active={activeTab} setActive={setActiveTab} color="bg-cyan-600/20 text-cyan-400 border-cyan-500/50" />
          <TabButton id="STANDBY" label="In Standby" count={standby.length} active={activeTab} setActive={setActiveTab} color="bg-orange-600/20 text-orange-400 border-orange-500/50" />
          <TabButton id="TRATTATIVE_KO" label="Trattative KO" count={trattativeKO.length} active={activeTab} setActive={setActiveTab} color="bg-red-600/20 text-red-400 border-red-500/50" />
        </div>

        <div className="space-y-1 mt-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Contratti</span>
          <TabButton id="CONTRATTI_FIRMATI" label="Contratti Firmati" count={contrattiFirmati.length} active={activeTab} setActive={setActiveTab} color="bg-emerald-600/20 text-emerald-400 border-emerald-500/50" />
          <TabButton id="NOTIFICHE" label="Notifiche" count={unreadNotifCount} active={activeTab} setActive={setActiveTab} color="bg-amber-600/20 text-amber-400 border-amber-500/50" />
        </div>
      </div>

      {/* OVERLAY NOTIFICHE */}
      {activeTab === "NOTIFICHE" && (
        <div className="absolute inset-0 bg-gray-950 z-40 overflow-y-auto p-4 md:p-8 rounded-xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-amber-400 flex items-center">
                <Bell className="w-8 h-8 mr-3" />
                Notifiche <span className="ml-3 text-base font-normal text-gray-400">({unreadNotifCount} da leggere)</span>
              </h2>
              <button onClick={() => setActiveTab("DA_SVOLGERE")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition">
                ← Torna alla Dashboard
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
                <Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 italic">Nessuna notifica presente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(n => (
                  <div key={n.id} className={`p-6 rounded-xl border relative overflow-hidden transition-all ${n.isRead ? "bg-gray-900/50 border-gray-800 opacity-60" : "bg-gray-900 border-amber-500/40 shadow-lg shadow-amber-900/10"}`}>
                    {!n.isRead && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
                        NUOVA
                      </div>
                    )}
                    <h3 className="font-bold text-white text-lg mb-2">{n.title}</h3>
                    <p className="text-gray-300 text-sm mb-4">{n.message}</p>
                    <p className="text-xs text-gray-500 mb-6 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleString("it-IT")}
                    </p>
                    <div className="flex gap-3">
                      {!n.isRead && (
                        <button onClick={() => markAsRead(n.id)} className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition">
                          Segna come Letta
                        </button>
                      )}
                      {n.appointmentId && (
                        <button
                          onClick={() => { if (!n.isRead) markAsRead(n.id); setActiveTab("DA_SVOLGERE"); setSelectedApptId(n.appointmentId); }}
                          className="px-5 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-semibold transition"
                        >
                          Apri Scheda Appuntamento
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENUTO PRINCIPALE */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-white capitalize">{activeTab.replace(/_/g, " ").toLowerCase()}</h3>
            <p className="text-sm text-gray-400">Trovati {displayedAppts.length} appuntamenti in questa categoria.</p>
          </div>
          <button
            onClick={() => {
              if (displayedAppts.length > 0) {
                const name = displayedAppts[0]?.commerciale?.name || "Commerciale";
                exportAgendaToPDF(displayedAppts, name, new Date().toLocaleDateString());
              } else toast.error("Nessun appuntamento da stampare");
            }}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition text-sm"
          >
            <Printer className="w-4 h-4 mr-2 text-blue-400" /> Stampa Lista
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayedAppts.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center shadow-lg h-full flex flex-col items-center justify-center">
            <CheckCircle className="w-16 h-16 text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nessun elemento</h3>
            <p className="text-gray-500">Non ci sono appuntamenti in questa sezione.</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-12">
            {displayedAppts.map(appt => {
              const isUnconfirmed = appt.status === "NOT_CONFIRMED" || appt.status === "PENDING";
              const isDaGestire = appt.status === "DA_GESTIRE_COMMERCIALE";
              const o = getLatestOutcome(appt);

              return (
                <div key={appt.id} className={`bg-gray-900 rounded-xl border overflow-hidden shadow-lg ${isDaGestire ? "border-indigo-900/50" : "border-gray-800"}`}>
                  <div className={`px-4 py-3 border-b flex justify-between items-center ${isDaGestire ? "bg-indigo-900/20 border-indigo-800/30" : isUnconfirmed ? "bg-yellow-900/20 border-yellow-800/30" : "bg-gray-800 border-gray-700"}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm font-bold text-white">
                        <Clock className="w-4 h-4 mr-2 text-blue-400" />
                        {new Date(appt.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {appt.isPhoneAppt && <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-500/50 inline-flex items-center"><PhoneCall className="w-3 h-3 mr-1" /> Telefonico</span>}
                        {appt.isSecondAppt && <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded border border-teal-500/50 inline-flex items-center"><RefreshCw className="w-3 h-3 mr-1" /> 2° App</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {o && o.outcomeFinal === "STANDBY" && <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded border border-orange-700/50 flex items-center"><PauseCircle className="w-3 h-3 mr-1" /> Standby</span>}
                      {o && o.outcomeFinal === "VENDUTO" && <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700/50 flex items-center"><Handshake className="w-3 h-3 mr-1" /> Contratto</span>}
                      {o && o.outcomeFinal === "KO" && <span className="text-[10px] font-bold uppercase tracking-wider bg-red-900/50 text-red-400 px-2 py-0.5 rounded border border-red-700/50 flex items-center"><XCircle className="w-3 h-3 mr-1" /> KO</span>}
                      {isDaGestire ? <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded border border-indigo-700/50">Richiamo</span>
                        : isUnconfirmed ? <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded border border-yellow-700/50 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Da Confermare</span>
                        : <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded border border-blue-700/50">In Agenda</span>}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="space-y-3 flex-1">
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1">{appt.contact.name}</h3>
                        <div className="flex items-start text-sm text-gray-400">
                          <MapPin className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                          <span>{appt.contact.address} ({appt.contact.cap})</span>
                        </div>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-2">
                        <div className="flex items-center text-sm"><User className="w-4 h-4 text-gray-500 mr-2 shrink-0" /><span className="text-gray-300"><strong className="text-white">{appt.referentName}</strong> - {appt.referentRole}</span></div>
                        <div className="flex items-center text-sm"><Phone className="w-4 h-4 text-gray-500 mr-2 shrink-0" /><span className="text-blue-400 font-mono">{appt.phone}</span></div>
                        <div className="flex items-start text-sm"><FileText className="w-4 h-4 text-gray-500 mr-2 shrink-0 mt-0.5" /><span className="text-gray-300 italic">&quot;{appt.clientNeeds || "Nessuna nota"}&quot;</span></div>
                        {o && <div className="mt-2 pt-2 border-t border-gray-800 text-sm flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /><span className="text-gray-300">Esito: <strong className="text-white">{o.notes}</strong></span></div>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                      <button onClick={() => setSelectedApptId(appt.id)} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-900/20">
                        {o ? "Modifica Esito" : "Inserisci Esito"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALI */}
      {selectedApptId && (
        <OutcomeModal
          appointmentId={selectedApptId}
          onClose={() => setSelectedApptId(null)}
          onSuccess={(triggerFixAppt) => {
            const appt = appointments.find(a => a.id === selectedApptId);
            setSelectedApptId(null);
            fetchAppointments();
            if (triggerFixAppt && appt) {
              setFixApptContactInfo({
                contactId: appt.contactId,
                cap: appt.contact.cap,
                referentName: appt.referentName || appt.contact.name,
                phone: appt.phone || appt.contact.originalPhone
              });
            }
          }}
        />
      )}

      {fixApptContactInfo && (
        <AppointmentModal
          contactId={fixApptContactInfo.contactId}
          cap={fixApptContactInfo.cap}
          initialReferentName={fixApptContactInfo.referentName}
          initialPhone={fixApptContactInfo.phone}
          onClose={() => setFixApptContactInfo(null)}
          onSuccess={() => { setFixApptContactInfo(null); fetchAppointments(); }}
        />
      )}
    </div>
  );
}

function TabButton({ id, label, count, active, setActive, color }: { id: TabType; label: string; count: number; active: TabType; setActive: (t: TabType) => void; color: string }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition flex items-center justify-between ${isActive ? color : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750"}`}
    >
      <span className="font-semibold text-sm">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-black/20 text-white" : "bg-gray-700 text-gray-300"}`}>{count}</span>
    </button>
  );
}