"use client";

import { useState, useEffect } from "react";
import { X, Search, AlertTriangle, CheckCircle, Database } from "lucide-react";
import toast from "react-hot-toast";

interface SearchContactModalProps {
  onClose: () => void;
  onSelect: (contactId: string) => void; // Restituisce l'id per forzare il refresh
}

export default function SearchContactModal({ onClose, onSelect }: SearchContactModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data.contacts || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [query]);

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact);
    if (contact.isLocked) {
      setShowWarning(true);
    } else {
      forceAssign(contact.id);
    }
  };

  const forceAssign = async (contactId: string) => {
    setAssigning(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/force-assign`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Contatto estratto con successo!");
        onSelect(contactId);
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore durante l'estrazione.");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setAssigning(false);
    }
  };

  if (showWarning && selectedContact) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-gray-800 rounded-xl border border-red-500/50 w-full max-w-md p-6 shadow-2xl relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Attenzione!</h3>
            <p className="text-gray-300 mb-2">
              Stai cercando di gestire <strong>{selectedContact.name}</strong>, ma attualmente è in blocco.
            </p>
            <div className="bg-gray-900 border border-gray-700 w-full p-4 rounded-lg my-4 text-left">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Motivo del blocco:</p>
              <p className="text-red-400 font-medium">{selectedContact.lockReason}</p>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Forzando l'estrazione lo riporterai in stato lavorabile e te lo assegnerai. Vuoi procedere comunque?
            </p>
            
            <div className="flex space-x-3 w-full">
              <button 
                disabled={assigning}
                onClick={() => { setShowWarning(false); setSelectedContact(null); }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Annulla
              </button>
              <button 
                disabled={assigning}
                onClick={() => forceAssign(selectedContact.id)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {assigning ? "Estrazione..." : "Sì, Forza Assegnazione"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-700 flex flex-col h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Search className="w-5 h-5 mr-3 text-blue-400" /> Ricerca Globale (Calderone)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 shrink-0">
          <div className="relative">
            <input 
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca per Ragione Sociale, Telefono, Indirizzo o CAP..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 text-lg shadow-inner"
            />
            <Search className="w-6 h-6 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
          </div>
          {query.length > 0 && query.length < 3 && (
            <p className="text-sm text-yellow-500 mt-2">Digita almeno 3 caratteri...</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-3">
          {loading && <p className="text-center text-gray-400 py-8 animate-pulse">Ricerca in corso...</p>}
          {!loading && results.length === 0 && query.length >= 3 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nessun contatto trovato per "{query}"</p>
            </div>
          )}
          
          {!loading && results.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => handleContactClick(contact)}
              className="bg-gray-900 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/80 p-4 rounded-lg cursor-pointer transition flex items-center justify-between group"
            >
              <div>
                <h4 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">{contact.name}</h4>
                <div className="flex items-center text-sm text-gray-400 mt-1 space-x-3">
                  {contact.phone && <span>📞 {contact.phone}</span>}
                  {contact.address && <span>📍 {contact.address} {contact.cap}</span>}
                </div>
              </div>
              <div className="text-right">
                {contact.isLocked ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/50">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Bloccato
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/50">
                    <CheckCircle className="w-3 h-3 mr-1" /> Libero
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
