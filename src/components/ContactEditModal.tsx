import { useState, useEffect } from "react";
import { X, Save, User, MapPin, Phone, Building, Briefcase, Mail, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface ContactEditModalProps {
  contactId?: string | null; // se null, è in modalità CREA NUOVO
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ContactEditModal({ contactId, isOpen, onClose, onSaved }: ContactEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    originalPhone: "",
    cap: "",
    sector: "",
    address: "",
    email: "",
    referentName: "",
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      if (contactId) {
        setLoading(true);
        fetch(`/api/tl/contacts/${contactId}?t=${Date.now()}`)
          .then(async res => {
             const data = await res.json();
             if (res.ok && data.contact) {
                setFormData({
                  name: data.contact.name || "",
                  originalPhone: data.contact.originalPhone || "",
                  cap: data.contact.cap || "",
                  sector: data.contact.sector || "",
                  address: data.contact.address || "",
                  email: data.contact.email || "",
                  referentName: data.contact.referentName || "",
                  notes: data.contact.notes || ""
                });
             } else {
                toast.error(data.error || "Errore nel caricamento dati");
             }
          })
          .catch((err) => toast.error("Errore Rete: " + err.message))
          .finally(() => setLoading(false));
      } else {
        setFormData({
          name: "",
          originalPhone: "",
          cap: "",
          sector: "",
          address: "",
          email: "",
          referentName: "",
          notes: ""
        });
      }
    }
  }, [isOpen, contactId]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.cap || !formData.sector) {
      toast.error("Nome, CAP e Settore sono obbligatori");
      return;
    }

    setSaving(true);
    try {
      const url = contactId ? `/api/tl/contacts/${contactId}` : "/api/tl/contacts/manual";
      const method = contactId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(contactId ? "Contatto aggiornato!" : "Contatto creato!");
        onSaved();
        onClose();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Errore durante il salvataggio");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30 rounded-t-xl">
          <h2 className="text-xl font-bold text-white flex items-center">
            {contactId ? (
              <><User className="w-5 h-5 mr-2 text-blue-400" /> Modifica Contatto</>
            ) : (
              <><User className="w-5 h-5 mr-2 text-emerald-400" /> Nuovo Contatto</>
            )}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 bg-gray-800 rounded hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><Building className="w-3 h-3 mr-1" /> Ragione Sociale *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Es. Rossi Srl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><Briefcase className="w-3 h-3 mr-1" /> Settore *</label>
                <input type="text" name="sector" value={formData.sector} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Es. Edilizia" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><Phone className="w-3 h-3 mr-1" /> Telefono Principale</label>
                <input type="text" name="originalPhone" value={formData.originalPhone} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Es. 02 123456" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><Mail className="w-3 h-3 mr-1" /> Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Es. info@rossi.it" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><MapPin className="w-3 h-3 mr-1" /> CAP *</label>
                <input type="text" name="cap" value={formData.cap} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Es. 00100" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><MapPin className="w-3 h-3 mr-1" /> Indirizzo Completo</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Es. Via Roma 1, Milano" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><User className="w-3 h-3 mr-1" /> Referente (Nome e Ruolo)</label>
                <input type="text" name="referentName" value={formData.referentName} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Es. Mario Rossi - Titolare" />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center"><FileText className="w-3 h-3 mr-1" /> Note Aggiuntive</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none" placeholder="Note interne sul contatto..." />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-800/30 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700">
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
            {contactId ? "Salva Modifiche" : "Crea Contatto"}
          </button>
        </div>
      </div>
    </div>
  );
}
