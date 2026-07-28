"use client";

import { useState, useEffect } from "react";
import { CheckCircle, FileText, Phone, MapPin, RefreshCw, AlertCircle, FileUp, X } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type TabType = "RECEIVED" | "REQUESTS";

export default function QuotesClient() {
  const [activeTab, setActiveTab] = useState<TabType>("REQUESTS");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  
  // For modal form
  const [newStatus, setNewStatus] = useState("");
  const [tlNotes, setTlNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("type", activeTab);
      if (activeTab === "REQUESTS" && statusFilter) {
        params.append("status", statusFilter);
      }
      
      const res = await fetch(`/api/tl/quotes?${params.toString()}`);
      const json = await res.json();
      setData(json.items || []);
    } catch (e) {
      toast.error("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        return data.url;
      } else {
        toast.error("Errore upload file");
        return null;
      }
    } catch (e) {
      toast.error("Errore di rete durante upload");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmitting(true);
    try {
      let quoteUrl = selectedReq.quoteUrl;
      if (file) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
           quoteUrl = uploadedUrl;
        } else {
           setSubmitting(false);
           return;
        }
      }

      const res = await fetch(`/api/tl/quotes/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           status: newStatus,
           tlNotes,
           quoteUrl
        })
      });

      if (res.ok) {
        toast.success("Richiesta aggiornata con successo");
        setSelectedReq(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore durante l'aggiornamento");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (req: any) => {
     setSelectedReq(req);
     setNewStatus(req.status);
     setTlNotes(req.tlNotes || "");
     setFile(null);
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
            <FileText className="w-5 h-5 mr-2 text-purple-400" />
            Preventivi
          </h2>
        </div>
        
        <div className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab("REQUESTS")} 
            className={`w-full flex items-center px-4 py-3 rounded-lg transition font-medium ${activeTab === "REQUESTS" ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'}`}
          >
            <AlertCircle className="w-5 h-5 mr-3" /> Richieste in Attesa
          </button>
          <button 
            onClick={() => setActiveTab("RECEIVED")} 
            className={`w-full flex items-center px-4 py-3 rounded-lg transition font-medium ${activeTab === "RECEIVED" ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'}`}
          >
            <CheckCircle className="w-5 h-5 mr-3" /> Inviati dal Commerciale
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Filter Bar */}
        <div className="bg-gray-900 border-b border-gray-800 p-4 flex gap-4 items-end shadow-sm">
          {activeTab === "REQUESTS" && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Stato Richiesta</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500 w-48">
                <option value="">Tutti</option>
                <option value="PENDING">Da Iniziare (Pending)</option>
                <option value="IN_LAVORAZIONE">In Lavorazione</option>
                <option value="REVISIONE">In Revisione</option>
                <option value="COMPLETATO">Completato</option>
                <option value="ANNULLATO">Annullato</option>
              </select>
            </div>
          )}
          
          <div className="flex-1"></div>
          
          <button onClick={fetchData} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-md text-sm flex items-center transition">
            <RefreshCw className="w-4 h-4 mr-2 text-gray-400" /> Aggiorna
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
             <div className="flex justify-center items-center h-full">
               <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : data.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <FileText className="w-16 h-16 mb-4 opacity-50" />
               <p className="text-lg">Nessun preventivo trovato</p>
             </div>
          ) : (
             <div className="space-y-4 max-w-4xl mx-auto">
               {data.map((item: any) => {
                 const appt = item.appointment;
                 return (
                   <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                     
                     <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <div className="flex items-center space-x-3">
                           <span className="text-gray-400 text-sm font-medium">
                             {new Date(appt.date).toLocaleDateString()}
                           </span>
                           <span className="text-gray-600 text-sm">•</span>
                           <span className="text-gray-300 text-sm font-medium flex items-center">
                             <Phone className="w-3.5 h-3.5 mr-1" /> {activeTab === "REQUESTS" ? item.commerciale?.name : appt.commerciale?.name}
                           </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                           {activeTab === "REQUESTS" && (
                              <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                                item.status === "COMPLETATO" ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700/50' : 
                                item.status === "ANNULLATO" ? 'bg-red-900/50 text-red-400 border-red-700/50' :
                                'bg-yellow-900/50 text-yellow-400 border-yellow-700/50'
                              }`}>
                                {item.status.replace("_", " ")}
                              </span>
                           )}
                           {activeTab === "RECEIVED" && (
                              <span className="bg-blue-900/50 text-blue-400 border border-blue-700/50 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                ALLEGATO DAL COMMERCIALE
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

                       <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 mb-4">
                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note Commerciale</h4>
                         <p className="text-sm text-gray-300 whitespace-pre-wrap">{activeTab === "REQUESTS" ? item.notes : item.notes}</p>
                       </div>

                       {item.quoteUrl && (
                          <div className="mt-4 flex items-center">
                             <a href={item.quoteUrl} target="_blank" rel="noopener noreferrer" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center">
                               <FileText className="w-4 h-4 mr-2" /> Visualizza Preventivo
                             </a>
                          </div>
                       )}

                       {activeTab === "REQUESTS" && item.tlNotes && (
                          <div className="mt-4 bg-purple-900/20 rounded-lg p-4 border border-purple-800/30">
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Risposta TL</h4>
                            <p className="text-sm text-purple-200 whitespace-pre-wrap">{item.tlNotes}</p>
                          </div>
                       )}
                     </div>

                     {activeTab === "REQUESTS" && (
                       <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-end">
                         <button 
                           onClick={() => openModal(item)}
                           className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 font-medium px-6 py-2 rounded-lg transition"
                         >
                           Gestisci Richiesta
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

      {/* Modal Gestione Richiesta */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Gestisci Preventivo</h2>
              <button onClick={() => setSelectedReq(null)} className="text-gray-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
               <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stato Lavorazione</label>
                  <select required value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-white">
                    <option value="PENDING">Da Iniziare (Pending)</option>
                    <option value="IN_LAVORAZIONE">In Lavorazione</option>
                    <option value="REVISIONE">In Revisione</option>
                    <option value="COMPLETATO">Completato</option>
                    <option value="ANNULLATO">Annullato</option>
                  </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                   <FileUp className="w-4 h-4 mr-2 text-purple-400" />
                   Allega Preventivo Fatto (PDF/Foto)
                 </label>
                 <input 
                   type="file" 
                   accept=".pdf,image/*"
                   onChange={handleFileChange}
                   className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/30 file:text-purple-400 hover:file:bg-purple-900/50 cursor-pointer"
                 />
                 {selectedReq.quoteUrl && !file && (
                    <p className="mt-2 text-xs text-emerald-400 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Un file è già allegato a questa richiesta.</p>
                 )}
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Note per il Commerciale (Opzionali)</label>
                  <textarea
                    value={tlNotes}
                    onChange={(e) => setTlNotes(e.target.value)}
                    className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Es. Preventivo calcolato su X mesi con sconto Y..."
                  />
               </div>

               <div className="pt-4 mt-6 border-t border-gray-700 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                 <button type="button" onClick={() => setSelectedReq(null)} className="w-full px-4 py-3 text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition font-medium text-center">Annulla</button>
                 <button type="submit" disabled={submitting || uploading} className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex justify-center items-center">
                   {(submitting || uploading) ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Salva Modifiche"}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
