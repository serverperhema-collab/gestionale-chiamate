"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, PhoneCall, Building2, MapPin, LogOut, ArrowRight, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";
import Link from "next/link";
import CreateContactModal from "@/components/CreateContactModal";
import AppointmentModal from "@/components/AppointmentModal";
import SearchContactModal from "@/components/SearchContactModal";
import TrattativaTimeline from "@/components/TrattativaTimeline";

export default function OperatorTerminal() {
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Security Locks
  const [isSuspended, setIsSuspended] = useState(false);
  const [modLocked, setModLocked] = useState(false);
  const [skipLocked, setSkipLocked] = useState(false);
  const [notAvailableLocked, setNotAvailableLocked] = useState(false);
  const [noAnswerLocked, setNoAnswerLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  // Temporary fields for inline editing
  const [tempFields, setTempFields] = useState({
    originalPhone: "",
    n2Phone: "",
    email: "",
    referentName: "",
    website: "",
    notes: ""
  });

  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipNotes, setSkipNotes] = useState("");

  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashNotes, setTrashNotes] = useState("");


  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [notInterestedValue, setNotInterestedValue] = useState("3");
  const [notInterestedUnit, setNotInterestedUnit] = useState("months");
  const [notAvailableDelay, setNotAvailableDelay] = useState("2");
  const [targetCompany, setTargetCompany] = useState("PERSONALE_HEMA");
  
  const [negoModalOpen, setNegoModalOpen] = useState(false);
  const [negoNotes, setNegoNotes] = useState("");
  const [negoDate, setNegoDate] = useState("");
  const [negoTime, setNegoTime] = useState("");
  const [negoReferent, setNegoReferent] = useState("");
  const [negoPhone, setNegoPhone] = useState("");
  const [negoAddress, setNegoAddress] = useState("");
  const [negoContactNotes, setNegoContactNotes] = useState("");
  const [negoAssignTo, setNegoAssignTo] = useState<"OPERATOR" | "COMMERCIALE">("OPERATOR");
  const [negoCommercialeId, setNegoCommercialeId] = useState("");
  const [availableCommerciali, setAvailableCommerciali] = useState<any[]>([]);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [activeRecall, setActiveRecall] = useState<any>(null);
    const [postponeMinutes, setPostponeMinutes] = useState("10");
  const [showRecallAlert, setShowRecallAlert] = useState(false);
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [gestioneSeparataModalOpen, setGestioneSeparataModalOpen] = useState(false);
  const [gestioneSeparataNotes, setGestioneSeparataNotes] = useState("");

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [timelineTrattativaId, setTimelineTrattativaId] = useState<string | null>(null);

  const fetchNextContact = useCallback(async (forcedContactId?: string) => {
    setLoading(true);
    setModLocked(false);
    setSkipLocked(false);
    setIsSuspended(false);
    try {
      const url = forcedContactId ? `/api/contacts/next?contactId=${forcedContactId}` : "/api/contacts/next";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setContact(data.contact);
        if (data.skipLocked !== undefined) setSkipLocked(data.skipLocked);
        setLockedUntil(null);
        setCountdown("");
        setTempFields({
          originalPhone: data.contact.originalPhone === "N/D" ? "" : (data.contact.originalPhone || ""),
          n2Phone: data.contact.phones?.[0]?.phone === "N/D" ? "" : (data.contact.phones?.[0]?.phone || ""),
          email: data.contact.email === "N/D" ? "" : (data.contact.email || ""),
          referentName: data.contact.referentName === "N/D" ? "" : (data.contact.referentName || ""),
          website: data.contact.website === "N/D" ? "" : (data.contact.website || ""),
          notes: data.contact.notes || ""
        });
      } else {
        setContact(null);
        if (data.isSuspended) setIsSuspended(true);
        if (data.noAnswerLocked) setNoAnswerLocked(true);
        if (data.skipLocked) setSkipLocked(true);
        if (data.notAvailableLocked) setNotAvailableLocked(true);
        if (data.lockedUntil) setLockedUntil(new Date(data.lockedUntil));
        
        if (data.error !== "Nessun contatto disponibile per i CAP assegnati.") {
            // Evitiamo di mostrare il toast per i blocchi, dato che la UI mostra già la schermata rossa "Sei Bloccato"
            if (!data.noAnswerLocked && !data.skipLocked && !data.notAvailableLocked && !data.isSuspended) {
              toast.error(data.error);
            }
        }
      }
    } catch (error) {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlContactId = urlParams.get("contactId");
      if (urlContactId) {
        fetchNextContact(urlContactId);
        // Rimuove il query param per pulizia dell'interfaccia
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        fetchNextContact();
      }
    }
  }, [fetchNextContact]);

  useEffect(() => {
    const playNotificationSound = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
      audio.play().catch(e => console.error("Sound play blocked:", e));
    };

    const checkRecalls = async () => {
      try {
        const res = await fetch(`/api/trattative?status=RICHIAMO_PERSONALE&operatorId=me&nextActionDateBefore=now&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.trattative && data.trattative.length > 0) {
            // Usa la prima trattativa scaduta come recall
            const st = data.trattative[0];
            // Format it to match expected activeRecall structure if needed, or pass it raw
            setActiveRecall({
              id: st.id,
              isST: true, // flag per il pop-up
              contact: st.contact,
              reason: st.clientNeeds || "Richiamo personale ST",
              nextActionDate: st.nextActionDate
            });
            setShowRecallAlert(true);
            playNotificationSound();
          }
        }
      } catch (err) {
        console.error("Poller recall error:", err);
      }
    };

    // Poll every 30 seconds
    checkRecalls();
    const interval = setInterval(checkRecalls, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = lockedUntil.getTime();
      const diff = end - now;

      if (diff <= 0) {
        setCountdown("Blocco terminato! Riprova.");
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleAutoSave = async (field: keyof typeof tempFields, value: string) => {
    if (!contact) return;
    
    // Controlla se il valore è effettivamente cambiato rispetto al DB
    let originalValue = "";
    if (field === "n2Phone") originalValue = contact.phones?.[0]?.phone || "";
    else originalValue = contact[field] || "";

    if (originalValue === value) return; // Nessuna modifica
    if (modLocked) {
      toast.error("Impossibile salvare, sei bloccato per troppe modifiche.");
      setTempFields({ ...tempFields, [field]: originalValue }); // Rollback UI
      return;
    }

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Salvato");
        setContact(data.contact);
        if (data.locked) {
          setModLocked(true);
          toast.error("BLOCCO MODIFICHE: Hai superato le 5 modifiche ai dati esistenti di oggi.", { duration: 6000 });
        }
      } else {
        if (res.status === 403) setModLocked(true);
        toast.error(data.error || "Errore di salvataggio");
        setTempFields({ ...tempFields, [field]: originalValue }); // Rollback UI
      }
    } catch (error) {
      toast.error("Errore di rete");
      setTempFields({ ...tempFields, [field]: originalValue }); // Rollback UI
    }
  };

  const handleGestioneSeparataRequest = async () => {
    if (!gestioneSeparataNotes.trim()) {
      toast.error("Inserisci la motivazione");
      return;
    }
    if (!contact) return;
    try {
      const res = await fetch("/api/contacts/gestione-separata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, reason: gestioneSeparataNotes })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.autoApproved) {
            toast.success("Contatto inviato alle pulizie (Auto-approvato)");
        } else {
            toast.success("Richiesta Gestione Separata inviata alla TL");
        }
        setGestioneSeparataModalOpen(false);
        setGestioneSeparataNotes("");
        fetchNextContact();
      } else {
        toast.error(data.error || "Errore durante l'invio della richiesta");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleOutcome = async (outcome: string, notes: string = "", recallDateStr?: string) => {
    if (!contact) return;
    
    setLoading(true);
    try {
      if (outcome === "REVIEW_REQUEST") {
        const res = await fetch(`/api/contacts/${contact.id}/review-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes })
        });
        if (res.ok) {
          toast.success("Richiesta di revisione inviata");
          setReviewModalOpen(false);
          setReviewNotes("");
          fetchNextContact();
        } else {
          const data = await res.json();
          toast.error(data.error || "Errore");
        }
        return;
      }

      let finalNotes = notes;
    let delayDurationObj = null;

    if (outcome === "NON_INTERESSATO") {
      const unitLabels: any = { "hours": "Ore", "days": "Giorni", "months": "Mesi" };
      const unitSingular: any = { "hours": "Ora", "days": "Giorno", "months": "Mese" };
      const val = parseInt(notInterestedValue) || 1;
      const label = val === 1 ? unitSingular[notInterestedUnit] : unitLabels[notInterestedUnit];
      finalNotes = `[${val} ${label}] ${notes}`;
      delayDurationObj = { value: val, unit: notInterestedUnit };
    }

    const payload: any = { outcome, notes: finalNotes };
    if (delayDurationObj) payload.delayDurationObj = delayDurationObj;
    if (recallDateStr) payload.recallDate = recallDateStr;
      if (outcome === "NOT_AVAILABLE") {
        payload.delayHours = notAvailableDelay;
      }

      let res;
      let data;

      // FASE 5: Se l'esito è RICHIAMO_PERSONALE, crea/riapre la ST e poi imposta il NextAction
      if (outcome === "RICHIAMO_PERSONALE") {
        const stRes = await fetch("/api/trattative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: contact.id })
        });
        
        if (!stRes.ok) {
          data = await stRes.json();
          res = stRes;
        } else {
          const stData = await stRes.json();
          const trattativaId = stData.trattativa.id;
          
          const actionPayload: any = {
              recallDate: recallDateStr,
              notes: notes
            };
            if (negoAssignTo === "COMMERCIALE" && negoCommercialeId) {
              actionPayload.commercialeId = negoCommercialeId;
            }
          
          res = await fetch(`/api/trattative/${trattativaId}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "richiamo", payload: actionPayload })
          });
          data = await res.json();
          
          if (res.ok) {
            // Sblocca il contatto chiamando l'API outcome
            const unlockRes = await fetch(`/api/contacts/${contact.id}/outcome`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            if (!unlockRes.ok) {
              res = unlockRes;
              data = await unlockRes.json();
            }
          }
        }
      } else {
        // Fallback per NO_ANSWER, NOT_AVAILABLE, KO standard (su Contact)
        res = await fetch(`/api/contacts/${contact.id}/outcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        data = await res.json();
      }
      
      if (res.ok) {
        if (data.locked) {
          if (data.reason?.includes("Skip")) setSkipLocked(true);
          if (data.reason?.includes("Non Risponde")) setNoAnswerLocked(true);
          if (data.reason?.includes("Non Reperibile")) setNotAvailableLocked(true);
          toast.error(`BLOCCO: ${data.reason}`, { duration: 6000 });
        }
        setSkipModalOpen(false);
        setSkipNotes("");
        setTrashModalOpen(false);
        setTrashNotes("");
        setOutcomeModalOpen(false);
        setOutcomeNotes("");
        setNegoModalOpen(false);
        setNegoNotes("");
        setNegoDate("");
        setNegoTime("");
        fetchNextContact();
      } else {
        if (res.status === 403 && data.error) {
          if (data.error.includes("Skip")) setSkipLocked(true);
          if (data.error.includes("Non Risponde")) setNoAnswerLocked(true);
          if (data.error.includes("Non Reperibile")) setNotAvailableLocked(true);
        }
        toast.error(data.error || "Errore");
        setLoading(false);
      }
    } catch(e) {
      toast.error("Errore di rete");
      setLoading(false);
    }
  };

  const requestOutcomeModal = (type: string) => {
    if (type === "NO_ANSWER" || type === "NO_INFO") {
      handleOutcome(type, "");
      return;
    }
    setOutcomeType(type);
    setOutcomeNotes("");
    setOutcomeModalOpen(true);
  };

  const googleSearchUrl = contact 
    ? `https://www.google.com/search?q=numero+di+telefono+${encodeURIComponent(contact.name + " " + contact.cap)}`
    : "#";

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold tracking-wide text-white flex items-center">
          <PhoneCall className="w-5 h-5 mr-2 text-blue-400" />
          Terminale Operatore
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSearchModalOpen(true)}
            className="px-3 py-1.5 bg-blue-900/40 border border-blue-800/50 hover:bg-blue-800/60 text-sm text-blue-200 rounded transition font-medium flex items-center"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Cerca
          </button>
          <Link href="/operator-dashboard/tl-requests" className="px-3 py-1.5 bg-red-900/40 border border-red-800/50 hover:bg-red-800/60 text-sm text-red-200 rounded transition font-medium">
            Richieste TL
          </Link>
          <Link href="/operator-dashboard/negotiations" className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 rounded transition font-medium">
            Trattative In Sospeso
          </Link>
          <Link href="/operator-dashboard/appointments" className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 rounded transition font-medium">
            I Miei Appuntamenti
          </Link>
          <button onClick={() => signOut()} className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-gray-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Work Area */}
      <main className="flex-1 p-6 flex items-start justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center mt-32 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">Elaborazione...</p>
          </div>
        ) : isSuspended ? (
          <div className="flex flex-col items-center justify-center mt-32 bg-red-900/20 p-8 rounded-2xl border border-red-500 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Operatore Sospeso</h2>
            <p className="text-gray-300 font-medium">
              Il tuo account è stato sospeso a tempo indeterminato dalla Team Leader. Non puoi accedere a nessun contatto.
            </p>
            <div className="mt-6 bg-red-950/50 border border-red-500/50 rounded-lg p-4 w-full">
              <span className="text-sm text-red-300 font-bold block">Rivolgiti al tuo responsabile per farti riammettere nel sistema.</span>
            </div>
            <button onClick={() => fetchNextContact()} className="mt-6 px-6 py-2.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white font-medium transition shadow-sm">
              Ricarica Pagina
            </button>
          </div>
        ) : (noAnswerLocked || skipLocked || notAvailableLocked) && !contact ? (
          <div className="flex flex-col items-center justify-center mt-32 bg-orange-900/20 p-8 rounded-2xl border border-orange-500 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Sei in Blocco Temporaneo</h2>
            <p className="text-gray-300">
              Il sistema anti-frode ti ha bloccato temporaneamente. Contatta la Team Leader per farti sbloccare o attendi il termine del blocco.
            </p>
            {countdown && (
              <div className="mt-4 bg-orange-950/50 border border-orange-500/50 rounded-lg p-3 w-full">
                <span className="text-sm text-orange-300 uppercase tracking-widest font-bold block mb-1">Tempo Rimanente</span>
                <span className="text-3xl font-mono text-white font-bold">{countdown}</span>
              </div>
            )}
            <button onClick={() => fetchNextContact()} className="mt-6 px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition">
              Verifica Sblocco
            </button>
          </div>
        ) : !contact ? (
          <div className="flex flex-col items-center justify-center mt-32 bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md text-center">
            <XCircle className="w-16 h-16 text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Calderone Vuoto</h2>
            <p className="text-gray-400">
              Non ci sono contatti disponibili per i CAP assegnati o non hai un'assegnazione per oggi.
            </p>
            <button onClick={() => fetchNextContact()} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition">
              Riprova
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-6">
            
            {(modLocked || skipLocked || noAnswerLocked || notAvailableLocked) && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center font-bold">
                  <AlertTriangle className="w-5 h-5 mr-2" /> Avviso di Sicurezza
                </div>
                {modLocked && <p>• Hai superato il limite di modifiche giornaliere consentite su dati preesistenti. Campi disabilitati.</p>}
                {skipLocked && <p>• Hai effettuato troppi Skip consecutivi. Funzione Skip disabilitata.</p>}
                {noAnswerLocked && <p>• Hai cliccato troppi "Non Risponde" ravvicinati. Funzioni bloccate temporaneamente per controlli anti-frode.</p>}
                {notAvailableLocked && <p>• Hai cliccato troppi "Non Reperibile" ravvicinati. Funzioni bloccate temporaneamente per controlli anti-frode.</p>}
                <p className="text-sm opacity-80 mt-1">Contatta la Team Leader per sbloccare immediatamente le funzioni.</p>
              </div>
            )}

            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                    {contact.name}
                  </h2>
                  <div className="flex flex-col md:flex-row md:items-center text-gray-400 gap-2 md:gap-4 text-sm">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-gray-500" />
                      <span className="leading-snug">{contact.address ? `${contact.address}, ` : ""}{contact.cap}</span>
                    </div>
                    <div className="hidden md:block text-gray-600">•</div>
                    <div className="flex items-start">
                      <Building2 className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-gray-500" />
                      <span className="leading-snug">{contact.sector}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <a 
                    href={googleSearchUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 rounded-lg transition font-semibold shadow-lg whitespace-nowrap"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    CERCA DETTAGLI<br className="sm:hidden" /> (GOOGLE)
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <PhoneCall className="w-4 h-4 mr-2" /> Numeri di Telefono
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-3 bg-gray-800 p-2 rounded-lg border border-gray-700 focus-within:border-emerald-500 transition-colors">
                      <span className="text-gray-400 font-bold w-8 text-center">N1</span>
                      <textarea 
                        rows={2}
                        value={tempFields.originalPhone}
                        onChange={(e) => setTempFields({...tempFields, originalPhone: e.target.value})}
                        onBlur={(e) => handleAutoSave('originalPhone', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        placeholder="inserisci il numero di telefono o cercalo su google cliccando in alto"
                        disabled={modLocked}
                        className="w-full bg-transparent border-none text-white font-mono text-base md:text-lg focus:outline-none placeholder-gray-500 placeholder:italic placeholder:text-[10px] xl:placeholder:text-[11px] disabled:opacity-50 resize-none py-1 leading-tight"
                      />
                    </li>
                    <li className="flex items-center space-x-3 bg-gray-800 p-2 rounded-lg border border-gray-700 focus-within:border-emerald-500 transition-colors">
                      <span className="text-gray-400 font-bold w-8 text-center">N2</span>
                      <textarea 
                        rows={2}
                        value={tempFields.n2Phone}
                        onChange={(e) => setTempFields({...tempFields, n2Phone: e.target.value})}
                        onBlur={(e) => handleAutoSave('n2Phone', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        placeholder="inserisci il numero di telefono o cercalo su google cliccando in alto"
                        disabled={modLocked}
                        className="w-full bg-transparent border-none text-white font-mono text-base md:text-lg focus:outline-none placeholder-gray-500 placeholder:italic placeholder:text-[10px] xl:placeholder:text-[11px] disabled:opacity-50 resize-none py-1 leading-tight"
                      />
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Dettagli Azienda</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-500 w-24">Referente:</span>
                      <input 
                        type="text"
                        value={tempFields.referentName}
                        onChange={(e) => setTempFields({...tempFields, referentName: e.target.value})}
                        onBlur={(e) => handleAutoSave('referentName', e.target.value)}
                        disabled={modLocked}
                        placeholder="inserisci nome e cognome del referente"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 placeholder-gray-500 placeholder:italic placeholder:text-[10px] xl:placeholder:text-[11px] text-ellipsis overflow-hidden"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 w-24">Email:</span>
                      <input 
                        type="text"
                        value={tempFields.email}
                        onChange={(e) => setTempFields({...tempFields, email: e.target.value})}
                        onBlur={(e) => handleAutoSave('email', e.target.value)}
                        disabled={modLocked}
                        placeholder="inserisci email aziendale"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 placeholder-gray-500 placeholder:italic placeholder:text-[10px] xl:placeholder:text-[11px] text-ellipsis overflow-hidden"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 w-24">Sito Web:</span>
                      <input 
                        type="text"
                        value={tempFields.website}
                        onChange={(e) => setTempFields({...tempFields, website: e.target.value})}
                        onBlur={(e) => handleAutoSave('website', e.target.value)}
                        disabled={modLocked}
                        placeholder="inserisci sito web aziendale"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 placeholder-gray-500 placeholder:italic placeholder:text-[10px] xl:placeholder:text-[11px] text-ellipsis overflow-hidden"
                      />
                    </div>
                    <div className="flex items-start pt-2 border-t border-gray-700">
                      <span className="text-gray-500 w-24 pt-1">Note Veloci:</span>
                      <textarea 
                        value={tempFields.notes}
                        onChange={(e) => setTempFields({...tempFields, notes: e.target.value})}
                        onBlur={(e) => handleAutoSave('notes', e.target.value)}
                        disabled={modLocked}
                        placeholder="annotazioni libere..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 resize-none h-20 placeholder-gray-500 placeholder:italic"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Esiti */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Pulsantiera Esiti</h3>
                <div className="flex flex-wrap gap-3">
                  <button disabled={noAnswerLocked} onClick={() => requestOutcomeModal("NO_ANSWER")} className="px-6 py-3 bg-amber-900/30 text-amber-500 hover:bg-amber-800 hover:text-white border border-amber-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                    <span className="font-bold">NON REPERIBILE</span>
                    <span className="text-xs italic opacity-80 font-normal">nessuna risposta, non reperibile</span>
                  </button>
                  <button disabled={noAnswerLocked} onClick={() => handleOutcome("NOT_AVAILABLE", "")} className="px-6 py-3 bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white border border-orange-500/30 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                    <span className="font-bold">RICHIAMO GENERICO</span>
                    <span className="text-xs italic opacity-80 font-normal">il titolare non era disponibile</span>
                  </button>
                  <button disabled={noAnswerLocked} onClick={() => requestOutcomeModal("NON_INTERESSATO")} className="px-6 py-3 bg-red-900/40 text-red-400 hover:bg-red-800 hover:text-white border border-red-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                    <span className="font-bold">NON INTERESSATO</span>
                    <span className="text-xs italic opacity-80 font-normal">non interessato, blocca per 3 mesi</span>
                  </button>
                  <button disabled={noAnswerLocked} onClick={() => {
                      setNegoReferent(contact.referentName || "");
                        setNegoPhone(contact.originalPhone || "");
                        setNegoAddress(contact.address || "");
                        setNegoContactNotes(contact.notes || "");
                        setNegoAssignTo("OPERATOR");
                        setNegoCommercialeId("");
                        setNegoModalOpen(true);
                        // Fetch commerciali
                        fetch("/api/commerciali")
                          .then(res => res.json())
                          .then(data => {
                            if (data.commerciali) setAvailableCommerciali(data.commerciali);
                          })
                          .catch(e => console.error("Errore fetch commerciali", e));
                    }} className="px-6 py-3 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/30 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                    <span className="font-bold">RICHIAMO PERSONALE</span>
                    <span className="text-xs italic opacity-80 font-normal">ho avuto una trattativa, fisso un ricontatto personale</span>
                  </button>
                  <button disabled={noAnswerLocked} onClick={() => setAppointmentModalOpen(true)} className="px-6 py-3 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 font-medium rounded-lg transition shadow-sm disabled:opacity-50">
                    Prendi Appuntamento
                  </button>
                  <button disabled={noAnswerLocked} onClick={() => setTrashModalOpen(true)} className="px-6 py-3 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 font-medium rounded-lg transition shadow-sm disabled:opacity-50">
                    Chiedi Eliminazione
                  </button>
                  <button disabled={noAnswerLocked} onClick={() => { setReviewNotes(""); setReviewModalOpen(true); }} className="px-6 py-3 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-800 hover:text-white border border-indigo-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                    <span className="font-bold">RICHIEDI REVISIONE TL</span>
                    <span className="text-xs italic opacity-85 font-normal">contatto già gestito o anomalo</span>
                  </button>
                    {!contact.isGestioneSeparata && (
                      <button disabled={noAnswerLocked} onClick={() => { setGestioneSeparataNotes(""); setGestioneSeparataModalOpen(true); }} className="px-6 py-3 bg-teal-900/30 text-teal-400 hover:bg-teal-800 hover:text-white border border-teal-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                        <span className="font-bold">GESTIONE SEPARATA</span>
                        <span className="text-xs italic opacity-85 font-normal">invia alla società di pulizie</span>
                      </button>
                    )}
                </div>
                <div className="mt-6 flex flex-col items-end gap-2">
                  <button 
                    onClick={() => setSkipModalOpen(true)}
                    disabled={skipLocked}
                    className="flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                  >
                    Prossimo (Skip) <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  <span className="text-gray-500 italic text-sm mr-4">oppure</span>
                  <CreateContactModal onCreated={fetchNextContact} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Skip Modal */}
      {skipModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Salta Contatto (Skip)</h3>
              <button onClick={() => setSkipModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Attenzione: stai saltando un contatto. Devi inserire una motivazione valida per giustificare lo skip. (Ricorda: dopo 3 skip vieni bloccato).
            </p>
            <textarea
              autoFocus
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-blue-500 resize-none mb-4"
              placeholder="Inserisci qui il motivo dello skip..."
              value={skipNotes}
              onChange={e => setSkipNotes(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setSkipModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                Annulla
              </button>
              <button 
                onClick={() => handleOutcome("SKIP", skipNotes)} 
                disabled={!skipNotes.trim() || skipLocked}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Conferma Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gestione Separata Modal */}
        {gestioneSeparataModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl border border-teal-500/30 w-full max-w-md p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-teal-400">Gestione Separata (Pulizie)</h3>
                <button onClick={() => setGestioneSeparataModalOpen(false)} className="text-gray-400 hover:text-white transition">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                Stai per segnalare questo contatto come appartenente alle <strong>imprese di pulizie</strong>.
                Inserisci una nota per il Team Leader che dovrà approvare la richiesta.
              </p>
              <textarea
                value={gestioneSeparataNotes}
                onChange={e => setGestioneSeparataNotes(e.target.value)}
                placeholder="Es. Fa solo pulizie, non usa abbigliamento..."
                className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 mb-4 resize-none"
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setGestioneSeparataModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Annulla</button>
                <button onClick={handleGestioneSeparataRequest} className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition shadow-lg shadow-teal-900/50">
                  Invia Richiesta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trash Modal */}
      {trashModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-400">Richiedi Eliminazione Contatto</h3>
              <button onClick={() => setTrashModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Sei sicuro che questo contatto sia completamente inutile (es. chiuso, inesistente, privato)? Inserisci il motivo. La richiesta verrà valutata dal Team Leader.
            </p>
            <textarea
              autoFocus
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-red-500 resize-none mb-4"
              placeholder="Spiega brevemente perché il contatto è da eliminare..."
              value={trashNotes}
              onChange={e => setTrashNotes(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setTrashModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                Annulla
              </button>
              <button 
                onClick={() => handleOutcome("TRASH_REQUEST", trashNotes)} 
                disabled={!trashNotes.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Invia Richiesta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-indigo-400">Richiedi Revisione Contatto (TL)</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Pensi che questo contatto sia già stato gestito o presenti anomalie da segnalare al Team Leader? La richiesta verrà valutata ed eventualmente sbloccata o archiviata.
            </p>
            <textarea
              autoFocus
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-indigo-500 resize-none mb-4"
              placeholder="Specifica perché richiedi la revisione (es: 'già gestito da Hema', 'telefono privato', 'ragione sociale errata')..."
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setReviewModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                Annulla
              </button>
              <button 
                onClick={() => handleOutcome("REVIEW_REQUEST", reviewNotes)} 
                disabled={!reviewNotes.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition disabled:opacity-50"
              >
                Invia Richiesta Revisione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Note Modal */}
      {outcomeModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {outcomeType === "NON_INTERESSATO" ? "Cliente Non Interessato" : "Imposta Richiamo Generico"}
              </h3>
              <button onClick={() => setOutcomeModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {outcomeType === "NON_INTERESSATO" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Nascondi e non richiamare per:</label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    min="1" 
                    value={notInterestedValue}
                    onChange={e => setNotInterestedValue(e.target.value)}
                    className="w-1/3 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-red-500" 
                  />
                  <select
                    value={notInterestedUnit}
                    onChange={e => setNotInterestedUnit(e.target.value)}
                    className="w-2/3 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="hours">Ore</option>
                    <option value="days">Giorni</option>
                    <option value="months">Mesi</option>
                  </select>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-400 mb-2">
              Inserisci una nota obbligatoria:
            </p>
            <textarea
              autoFocus
              className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-orange-500 resize-none mb-4"
              placeholder={outcomeType === "NON_INTERESSATO" ? "Specifica il motivo del disinteresse (es: prezzi alti, lavorano già con altri)..." : "es. segreteria, occupato, mi ha detto di riprovare..."}
              value={outcomeNotes}
              onChange={e => setOutcomeNotes(e.target.value)}
            />
            
            <div className="flex justify-between items-center">
              <button 
                onClick={() => handleOutcome("NO_INFO", "Nessuna Info")} 
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded font-medium transition"
              >
                Nessuna Info
              </button>
              
              <div className="flex space-x-3">
                <button onClick={() => setOutcomeModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                  Annulla
                </button>
                <button 
                  onClick={() => handleOutcome(outcomeType, outcomeNotes)} 
                  disabled={!outcomeNotes.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium transition disabled:opacity-50"
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      {negoModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl p-6 shadow-2xl my-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-purple-400">Inserisci Ricontatto e Anagrafica</h3>
                  <button onClick={() => setNegoModalOpen(false)} className="text-gray-400 hover:text-white">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex bg-gray-900 rounded-lg p-1 mb-4 border border-gray-700">
                  <button 
                    onClick={() => setNegoAssignTo("OPERATOR")}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${negoAssignTo === "OPERATOR" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Ricontatto Personale
                  </button>
                  <button 
                    onClick={() => setNegoAssignTo("COMMERCIALE")}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${negoAssignTo === "COMMERCIALE" ? "bg-orange-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
                  >
                    Richiamo Commerciale
                  </button>
                </div>
                
                {negoAssignTo === "COMMERCIALE" && (
                  <div className="mb-4 bg-orange-900/20 border border-orange-700/50 p-4 rounded-xl">
                    <label className="block text-xs font-bold text-orange-400 mb-2 uppercase">Assegna al Commerciale</label>
                    <select 
                      value={negoCommercialeId}
                      onChange={(e) => setNegoCommercialeId(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-orange-500"
                    >
                      <option value="">-- Seleziona un commerciale --</option>
                      {availableCommerciali.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <p className="text-sm text-gray-400 mb-4">
                  Verifica i dati anagrafici e imposta la data di ricontatto per la trattativa.
                </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">Referente</label>
                  <input type="text" value={negoReferent} onChange={e => setNegoReferent(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">Telefono</label>
                  <input type="text" value={negoPhone} onChange={e => setNegoPhone(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Indirizzo</label>
                  <input type="text" value={negoAddress} onChange={e => setNegoAddress(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Informazioni Aggiuntive</label>
                  <textarea value={negoContactNotes} onChange={e => setNegoContactNotes(e.target.value)} className="w-full h-16 bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500 resize-none" />
                </div>
              </div>

              <div className="border-t border-gray-700 my-4 pt-4">
                <p className="text-sm font-bold text-purple-400 mb-4">Dettagli Ricontatto</p>
                <div className="flex space-x-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Data</label>
                    <input type="date" value={negoDate} onChange={e => setNegoDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Ora</label>
                    <input type="time" value={negoTime} onChange={e => setNegoTime(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500" />
                  </div>
                </div>
                <textarea className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-purple-500 resize-none mb-4" placeholder="Di cosa avete parlato? Perchè va richiamato?" value={negoNotes} onChange={e => setNegoNotes(e.target.value)} />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button onClick={() => setNegoModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                  Annulla
                </button>
                <button 
                  onClick={async () => {
                    if (negoDate && negoTime && negoNotes.trim()) {
                      try {
                        await fetch(`/api/contacts/${contact.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            referentName: negoReferent,
                            originalPhone: negoPhone,
                            address: negoAddress,
                            notes: negoContactNotes
                          })
                        });
                      } catch (e) {
                        console.error("Errore salvataggio info contatto", e);
                      }

                      const isoDate = new Date(`${negoDate}T${negoTime}`).toISOString();
                      handleOutcome("RICHIAMO_PERSONALE", negoNotes, isoDate);
                    }
                  }} 
                  disabled={!negoDate || !negoTime || !negoNotes.trim() || (negoAssignTo === "COMMERCIALE" && !negoCommercialeId)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salva Ricontatto
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Appointment Modal */}
      {appointmentModalOpen && contact && (
        <AppointmentModal
          contactId={contact.id}
          cap={contact.cap}
          initialReferentName={contact.referentName}
          initialPhone={contact.originalPhone === "N/D" ? (contact.phones?.[0]?.phone === "N/D" ? "" : contact.phones?.[0]?.phone) : contact.originalPhone}
          initialEmail={contact.email === "N/D" ? "" : contact.email}
          onClose={() => setAppointmentModalOpen(false)}
          onSuccess={() => {
            fetchNextContact();
          }}
        />
      )}

      {/* Modal Alert Ricontatto */}
      {showRecallAlert && activeRecall && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-gray-800 rounded-2xl border-2 border-orange-500 w-full max-w-md p-6 shadow-2xl relative">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-orange-500 rounded-full p-4 shadow-lg border-4 border-gray-800">
              <PhoneCall className="w-8 h-8 text-white" />
            </div>
            
            <div className="text-center mt-6">
              <h3 className="text-xl font-black text-white tracking-wider uppercase mb-2">
                ATTENZIONE: RICHIAMO SCADUTO!
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                È arrivato il momento di richiamare questo cliente come programmato.
              </p>
              
              <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50 mb-6 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block mb-1">Azienda da contattare</span>
                <h4 className="text-lg font-bold text-white mb-2">{activeRecall.contact.name}</h4>
                <p className="text-sm font-mono text-gray-300 flex items-center">
                  <PhoneCall className="w-4 h-4 mr-2 text-gray-400" />
                  {activeRecall.contact.originalPhone || "Nessun numero"}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400">
                  <span className="font-semibold">Nota Trattativa:</span> "{activeRecall.reason}"
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setTimelineTrattativaId(activeRecall.id);
                      setShowRecallAlert(false);
                      setActiveRecall(null);
                    }}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl transition font-black tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-5 h-5" /> APRI SCHEDA TRATTATIVA
                  </button>
                  
                  <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-700 flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 whitespace-nowrap">POSTICIPA DI:</span>
                    <select
                      value={postponeMinutes}
                      onChange={e => setPostponeMinutes(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm focus:outline-none focus:border-orange-500"
                    >
                      <option value="10">10 Minuti</option>
                      <option value="30">30 Minuti</option>
                      <option value="60">1 Ora</option>
                      <option value="120">2 Ore</option>
                      <option value="1440">Domani (24 Ore)</option>
                    </select>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/operator/recalls/pending", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: activeRecall.id, minutes: parseInt(postponeMinutes) })
                          });
                          if (res.ok) {
                            toast.success(`Ricontatto posticipato`);
                            setShowRecallAlert(false);
                            setActiveRecall(null);
                          }
                        } catch (err) {
                          toast.error("Errore di rete");
                        }
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold text-sm transition"
                    >
                      Conferma
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {searchModalOpen && (
        <SearchContactModal 
          onClose={() => setSearchModalOpen(false)} 
          onSelect={(id) => {
            setSearchModalOpen(false);
            fetchNextContact(id);
          }}
        />
      )}
      {timelineTrattativaId && (
        <TrattativaTimeline 
          trattativaId={timelineTrattativaId} 
          onClose={() => setTimelineTrattativaId(null)} 
        />
      )}
    </div>
  );
}
