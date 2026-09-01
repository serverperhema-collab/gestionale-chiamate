"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Search, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

interface CreateAppointmentModalTLProps {
  commerciali: any[];
  onClose: () => void;
  onSuccess: () => void;
  prefilledAgendaId?: string;
  prefilledDate?: string;
  prefilledCommercialeId?: string;
}

export default function CreateAppointmentModalTL({ 
  commerciali, 
  onClose, 
  onSuccess,
  prefilledAgendaId,
  prefilledDate,
  prefilledCommercialeId
}: CreateAppointmentModalTLProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "new">("search");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  // New Contact state
  const [newContactData, setNewContactData] = useState({
    name: "",
    address: "",
    city: "",
    province: "",
    cap: "",
    phone: ""
  });

  const [formData, setFormData] = useState({
    date: prefilledDate || "",
    time: "09:00",
    referentName: "",
    referentRole: "",
    phone: "",
    email: "",
    clientNeeds: ""
  });

  // Handle contact search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.contacts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "search" && !selectedContact) {
      toast.error("Seleziona un contatto esistente o creane uno nuovo.");
      return;
    }

    if (mode === "new" && (!newContactData.name || !newContactData.address || !newContactData.city || !newContactData.province || !newContactData.cap || !newContactData.phone)) {
      toast.error("Compila tutti i campi obbligatori del nuovo contatto.");
      return;
    }

    if (!formData.date || !formData.time || !formData.referentName || !formData.referentRole || !formData.phone || !formData.clientNeeds) {
      toast.error("Compila tutti i campi obbligatori dell'appuntamento.");
      return;
    }

          setLoading(true);
      try {
        const [yearStr, monthStr, dayStr] = formData.date.split("-");
        const [hourStr, minStr] = formData.time.split(":");
        const dateTime = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), parseInt(hourStr), parseInt(minStr), 0).toISOString();
      
      const res = await fetch("/api/tl/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contactId: mode === "search" ? selectedContact.id : undefined,
          newContactData: mode === "new" ? newContactData : undefined,
          date: dateTime,
          zoneAgendaId: prefilledAgendaId || null
        })
      });

      if (res.ok) {
        toast.success("Appuntamento inserito con successo in agenda");
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch (err) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col max-h-[95vh]">
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-400" />
            Nuovo Appuntamento in Agenda
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          
          {/* Contact Selection Toggle */}
          <div className="flex space-x-2 bg-gray-900/50 p-1 rounded-lg w-full max-w-sm mx-auto border border-gray-700">
            <button
              type="button"
              onClick={() => { setMode("search"); setSelectedContact(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition ${mode === "search" ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Search className="w-4 h-4 mr-2" />
              Cerca Esistente
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition ${mode === "new" ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crea Nuovo
            </button>
          </div>

          {/* Search Existing Contact */}
          {mode === "search" && (
            <div className="bg-gray-900/30 border border-gray-700 p-4 rounded-xl space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cerca Azienda o Telefono</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedContact(null);
                    }}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white focus:border-purple-500 outline-none" 
                    placeholder="Digita almeno 3 caratteri per cercare..." 
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>

              {!selectedContact && searchResults.length > 0 && (
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900 shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                  {searchResults.map(contact => (
                    <div 
                      key={contact.id} 
                      onClick={() => {
                        setSelectedContact(contact);
                        setSearchQuery(contact.name);
                        setSearchResults([]);
                        setFormData({...formData, phone: contact.originalPhone || ""});
                      }}
                      className="p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition flex flex-col"
                    >
                      <span className="font-bold text-white text-sm">{contact.name}</span>
                      <span className="text-xs text-gray-400">Tel: {contact.originalPhone || "N/D"} - CAP: {contact.cap || "N/D"}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedContact && (
                <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-0.5">Contatto Selezionato</span>
                    <span className="text-white font-medium">{selectedContact.name}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedContact(null);
                      setSearchQuery("");
                    }}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    Cambia
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create New Contact */}
          {mode === "new" && (
            <div className="bg-gray-900/30 border border-gray-700 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Dati Nuovo Contatto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Nome Azienda *</label>
                  <input required value={newContactData.name} onChange={e => setNewContactData({...newContactData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Indirizzo *</label>
                  <input required value={newContactData.address} onChange={e => setNewContactData({...newContactData, address: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CittÃ  *</label>
                  <input required value={newContactData.city} onChange={e => setNewContactData({...newContactData, city: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Provincia (Sigla) *</label>
                  <input required maxLength={2} value={newContactData.province} onChange={e => setNewContactData({...newContactData, province: e.target.value.toUpperCase()})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CAP *</label>
                  <input required maxLength={5} value={newContactData.cap} onChange={e => setNewContactData({...newContactData, cap: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefono Azienda *</label>
                  <input required value={newContactData.phone} onChange={e => setNewContactData({...newContactData, phone: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
                </div>
              </div>
            </div>
          )}

          <hr className="border-gray-700" />

          {/* Appointment Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Appuntamento *</label>
              <input required type="date" value={formData.date} disabled={!!prefilledAgendaId} onChange={e => setFormData({...formData, date: e.target.value})} className={`w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 ${!!prefilledAgendaId ? 'text-gray-500 cursor-not-allowed opacity-70' : 'text-white'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ora Appuntamento *</label>
              <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome Referente *</label>
              <input required value={formData.referentName} onChange={e => setFormData({...formData, referentName: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ruolo Referente *</label>
              <input required value={formData.referentRole} onChange={e => setFormData({...formData, referentRole: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Telefono Diretto (Mobile) *</label>
              <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Note Cliente / Esigenze *</label>
            <textarea required value={formData.clientNeeds} onChange={e => setFormData({...formData, clientNeeds: e.target.value})} className="w-full h-24 bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 resize-none" />
          </div>

          </div>

          <div className="flex-shrink-0 flex justify-end space-x-3 p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition">
              Annulla
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition disabled:opacity-50">
              Inserisci in Agenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

