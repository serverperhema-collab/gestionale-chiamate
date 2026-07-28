"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, FileText, Phone, MapPin, Handshake, RefreshCw, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type TabType = "SVOLTI" | "SALTATI" | "KO_DA_DECIDERE";

export default function OutcomesClient() {
  const [activeTab, setActiveTab] = useState<TabType>("SVOLTI");
  
  // Filters
  const [commercialeId, setCommercialeId] = useState("");
  const [cap, setCap] = useState("");
  const [outcomeFinal, setOutcomeFinal] = useState("");
  const [skipReason, setSkipReason] = useState("");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Load commerciale users for filter
    fetch("/api/users?role=COMMERCIALE")
      .then(res => res.json())
      .then(d => {
         if (d.users) setUsers(d.users);
      });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "KO_DA_DECIDERE") {
        const res = await fetch(`/api/tl/outcomes/ko`);
        const json = await res.json();
        setData(json.outcomes || []);
      } else {
        const params = new URLSearchParams();
        if (commercialeId) params.append("commercialeId", commercialeId);
        if (cap) params.append("cap", cap);
        
        if (activeTab === "SVOLTI") {
          params.append("isSaltato", "false");
          if (outcomeFinal) params.append("outcomeFinal", outcomeFinal);
        } else if (activeTab === "SALTATI") {
          params.append("isSaltato", "true");
          if (skipReason) params.append("skipReason", skipReason);
        }
        
        const res = await fetch(`/api/tl/outcomes?${params.toString()}`);
        const json = await res.json();
        setData(json.outcomes || []);
      }
    } catch (e) {
      toast.error("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, commercialeId, cap, outcomeFinal, skipReason]);

  const handleKoDecision = async (id: string, action: "APPROVE" | "REJECT") => {
     if (!confirm(`Sei sicuro di voler ${action === "APPROVE" ? "confermare il KO" : "rifiutare il KO e rimettere in lavorazione"} il contatto?`)) return;
     
     try {
       const res = await fetch(`/api/tl/outcomes/ko/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ action })
       });
       if (res.ok) {
         toast.success("Decisione salvata");
         fetchData();
       } else {
         const data = await res.json();
         toast.error(data.error || "Errore durante il salvataggio");
       }
     } catch (e) {
       toast.error("Errore di rete");
     }
  };

  return (
    <div className="flex h-screen bg-gray-950">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link href="/tl-dashboard" className="text-gray-400 hover:text-white text-sm flex items-center mb-4 transition">
            ← Torna alla Dashboard
          </Link>
          <h2 className="text-xl font-bold text-white flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-blue-400" />
            Esiti Visite
          </h2>
        </div>
        
        <div className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab("SVOLTI")} 
            className={`w-full flex items-center px-4 py-3 rounded-lg transition font-medium ${activeTab === "SVOLTI" ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'}`}
          >
            <Handshake className="w-5 h-5 mr-3" /> Svolti
          </button>
          <button 
            onClick={() => setActiveTab("SALTATI")} 
            className={`w-full flex items-center px-4 py-3 rounded-lg transition font-medium ${activeTab === "SALTATI" ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'}`}
          >
            <XCircle className="w-5 h-5 mr-3" /> Saltati
          </button>
          <button 
            onClick={() => setActiveTab("KO_DA_DECIDERE")} 
            className={`w-full flex items-center px-4 py-3 rounded-lg transition font-medium ${activeTab === "KO_DA_DECIDERE" ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'}`}
          >
            <AlertTriangle className="w-5 h-5 mr-3" /> KO da Decidere
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Filter Bar */}
        {activeTab !== "KO_DA_DECIDERE" && (
          <div className="bg-gray-900 border-b border-gray-800 p-4 flex gap-4 items-end shadow-sm">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Commerciale</label>
              <select value={commercialeId} onChange={e => setCommercialeId(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 w-48">
                <option value="">Tutti</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">CAP</label>
              <input type="text" value={cap} onChange={e => setCap(e.target.value)} placeholder="Es. 00100" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 w-32" />
            </div>

            {activeTab === "SVOLTI" && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Esito</label>
                <select value={outcomeFinal} onChange={e => setOutcomeFinal(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 w-40">
                  <option value="">Tutti</option>
                  <option value="VENDUTO">Venduto</option>
                  <option value="NON_VENDUTO">Non Venduto</option>
                  <option value="RIPENSARCI">Ripensarci</option>
                  <option value="FOLLOWUP">Follow Up</option>
                  <option value="KO">KO</option>
                </select>
              </div>
            )}

            {activeTab === "SALTATI" && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Motivo</label>
                <select value={skipReason} onChange={e => setSkipReason(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500 w-48">
                  <option value="">Tutti</option>
                  <option value="SALTATO_CLIENTE">Colpa Cliente</option>
                  <option value="SALTATO_COMMERCIALE">Colpa Commerciale</option>
                </select>
              </div>
            )}
            
            <div className="flex-1"></div>
            
            <button onClick={fetchData} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-md text-sm flex items-center transition">
              <RefreshCw className="w-4 h-4 mr-2 text-gray-400" /> Aggiorna
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
             <div className="flex justify-center items-center h-full">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : data.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <FileText className="w-16 h-16 mb-4 opacity-50" />
               <p className="text-lg">Nessun esito trovato</p>
             </div>
          ) : (
             <div className="space-y-4 max-w-4xl mx-auto">
               {data.map((outcome: any) => {
                 const appt = outcome.appointment;
                 return (
                   <div key={outcome.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                     
                     <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <div className="flex items-center space-x-3">
                           <span className="text-gray-400 text-sm font-medium">
                             {new Date(appt.date).toLocaleDateString()}
                           </span>
                           <span className="text-gray-600 text-sm">•</span>
                           <span className="text-gray-300 text-sm font-medium flex items-center">
                             <Phone className="w-3.5 h-3.5 mr-1" /> {appt.commerciale?.name || "N/A"}
                           </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                           {activeTab === "KO_DA_DECIDERE" && (
                              <span className="bg-red-900/50 text-red-400 border border-red-700/50 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                RICHIESTA KO
                              </span>
                           )}
                           {activeTab === "SALTATI" && (
                              <span className="bg-orange-900/50 text-orange-400 border border-orange-700/50 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                {outcome.skipReason === "SALTATO_CLIENTE" ? "Colpa Cliente" : "Colpa Commerciale"}
                              </span>
                           )}
                           {activeTab === "SVOLTI" && (
                              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                                outcome.outcomeFinal === "VENDUTO" ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50' : 
                                outcome.outcomeFinal === "KO" ? 'bg-red-900/50 text-red-400 border-red-700/50' :
                                'bg-blue-900/50 text-blue-400 border-blue-700/50'
                              }`}>
                                {outcome.outcomeFinal.replace("_", " ")}
                              </span>
                           )}
                        </div>
                     </div>

                     <div className="p-5">
                       <h3 className="text-lg font-bold text-white mb-2">{appt.contact.name}</h3>
                       <div className="flex items-center text-sm text-gray-400 mb-4">
                         <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                         <span>{appt.contact.address} ({appt.contact.cap})</span>
                       </div>

                       <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note della Visita</h4>
                         <p className="text-sm text-gray-300 whitespace-pre-wrap">{outcome.notes}</p>
                       </div>

                       {/* Extra info for SVOLTI */}
                       {activeTab === "SVOLTI" && (
                         <div className="mt-4 flex flex-wrap gap-2">
                           {outcome.quoteAttached && (
                             <span className="bg-purple-900/30 text-purple-400 text-xs px-2 py-1 rounded border border-purple-800/50 flex items-center">
                               Preventivo Allegato
                             </span>
                           )}
                           {outcome.quoteRequested && (
                             <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded border border-blue-800/50 flex items-center">
                               Preventivo Richiesto
                             </span>
                           )}
                           {outcome.nextActionType && (
                             <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 flex items-center">
                               {outcome.nextActionType === "RICHIAMO" 
                                 ? `Richiamo ${outcome.nextActionTarget === "OPERATORE" ? "Operatore" : "Commerciale"} il ${new Date(outcome.nextActionDate).toLocaleDateString()}` 
                                 : "Vuole fissare 2° App."}
                             </span>
                           )}
                         </div>
                       )}

                       {/* Extra info for SALTATI */}
                       {activeTab === "SALTATI" && outcome.nextActionDate && (
                          <div className="mt-4 bg-gray-800/50 text-gray-300 text-sm px-3 py-2 rounded border border-gray-700 flex items-center w-max">
                            <RefreshCw className="w-4 h-4 mr-2 text-blue-400" />
                            Da rifissare dal: {new Date(outcome.nextActionDate).toLocaleDateString()}
                          </div>
                       )}
                     </div>

                     {/* Actions for KO_DA_DECIDERE */}
                     {activeTab === "KO_DA_DECIDERE" && (
                       <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex gap-3">
                         <button 
                           onClick={() => handleKoDecision(outcome.id, "REJECT")}
                           className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 font-medium py-2 rounded-lg transition"
                         >
                           Rifiuta KO e Rimetti in Lavorazione
                         </button>
                         <button 
                           onClick={() => handleKoDecision(outcome.id, "APPROVE")}
                           className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition"
                         >
                           Conferma KO (Blocca per 3 mesi)
                         </button>
                       </div>
                     )}

                   </div>
                 );
               })}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
