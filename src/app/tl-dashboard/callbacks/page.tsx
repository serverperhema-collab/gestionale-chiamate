"use client";

import { useState, useEffect } from "react";
import { PhoneCall, Building2, MapPin, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function TLCallbacksPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tl/callbacks");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      } else {
        toast.error("Errore di caricamento");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFreeContact = async (contactId: string) => {
    try {
      // Per liberare il contatto basta un piccolo endpoint o usiamo un metodo PATCH
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: null, isPersonalCallback: false })
      });
      if (res.ok) {
        toast.success("Contatto sbloccato e rimesso nel calderone");
        fetchData();
      } else {
        toast.error("Errore durante lo sblocco");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <PhoneCall className="w-6 h-6 mr-3 text-purple-400" />
          I Miei Ricontatti Personali
        </h2>
        <p className="text-gray-400 mt-1">
          Questa è la tua scrivania personale. Qui trovi i contatti degli appuntamenti che hai annullato per richiamarli tu.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-gray-800 p-8 text-center rounded-xl border border-gray-700 text-gray-400">
          Nessun contatto nella tua scrivania personale.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-white mb-1 flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                  {contact.name}
                </h4>
              </div>
              <div className="text-sm text-gray-400 mb-4 space-y-1">
                <p className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-500" /> {contact.address} ({contact.cap})</p>
                <p className="flex items-center"><PhoneCall className="w-4 h-4 mr-2 text-gray-500" /> {contact.originalPhone}</p>
              </div>

              {contact.referentName && (
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
                  <p className="text-xs text-gray-500">Referente</p>
                  <p className="text-sm text-white">{contact.referentName} ({contact.referentRole})</p>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleFreeContact(contact.id)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition font-medium text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Rilascia nel Calderone
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
