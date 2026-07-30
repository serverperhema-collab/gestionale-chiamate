"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Phone, XCircle, Calendar, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import AppointmentModal from "@/components/AppointmentModal";

export default function OperatorTlRequestsPage() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentContactId, setAppointmentContactId] = useState("");
  const [appointmentContactCap, setAppointmentContactCap] = useState("");

  const fetchNegotiations = async () => {
    try {
      const res = await fetch("/api/operator/negotiations");
      if (res.ok) {
        const data = await res.json();
        // MOSTRA SOLO le richieste della TL
        setNegotiations(data.negotiations.filter((n: any) => n.reason.startsWith("[TL_REQUEST]")));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore di caricamento");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const handleAbandon = async (id: string) => {
    if (!confirm("Sei sicuro di voler scartare questa richiesta? Il contatto tornerà nel calderone per tutti.")) return;
    
    try {
      const res = await fetch(`/api/operator/negotiations/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ABANDON" })
      });
      if (res.ok) {
        toast.success("Richiesta scartata");
        setNegotiations(negotiations.filter(n => n.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-900 min-h-screen text-gray-100">
      {/* Appointment Modal */}
      {appointmentModalOpen && (
        <AppointmentModal
          contactId={appointmentContactId}
          cap={appointmentContactCap}
          onClose={() => setAppointmentModalOpen(false)}
          onSuccess={() => {
            fetchNegotiations();
          }}
        />
      )}

      <div className="mb-6">
        <Link href="/operator-terminal" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna al Terminale
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
          <AlertCircle className="w-6 h-6 mr-3 text-red-500" />
          Richieste TL (Assegnazioni)
        </h2>
        <p className="text-gray-400 mt-1">
          Questa sezione contiene i contatti che la Team Leader ti ha assegnato forzatamente.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : negotiations.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessuna richiesta</h3>
          <p className="text-gray-400">Non hai assegnazioni pendenti dalla TL al momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {negotiations.map((neg) => {
            const isExpired = neg.expiresAt && new Date(neg.expiresAt) < new Date();
            const cleanReason = neg.reason.replace("[TL_REQUEST] ", "");
            
            return (
              <div key={neg.id} className={`bg-gray-800 rounded-xl border p-6 shadow-lg relative flex flex-col ${isExpired ? 'border-red-500/50' : 'border-red-500/30'}`}>
                {isExpired && (
                  <div className="absolute top-0 right-0 p-1.5 px-3 bg-red-600 rounded-bl-lg rounded-tr-lg">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Scaduta</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4 mt-2">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{neg.contact.name}</h3>
                    <p className="text-sm text-gray-400 font-mono">{neg.contact.originalPhone || "Nessun numero"}</p>
                    <p className="text-xs text-gray-500 mt-1">{neg.contact.address} ({neg.contact.cap})</p>
                  </div>
                </div>
                
                <div className="mb-6 flex-1">
                  <div className="text-sm text-red-200 font-semibold bg-red-900/20 border border-red-800/30 p-3 rounded-lg mb-4">
                    Direttiva TL: "{cleanReason}"
                  </div>

                  <div className="flex items-center text-sm font-semibold mb-2 text-gray-300">
                    <Clock className="w-4 h-4 mr-1.5 text-blue-400" />
                    Assegnato per: <span className="ml-2 font-normal text-white">{new Date(neg.recallDate).toLocaleString()}</span>
                  </div>

                  {neg.expiresAt && (
                    <div className={`flex items-center text-sm font-semibold mb-2 ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                      <Clock className="w-4 h-4 mr-1.5" />
                      Scadenza: <span className="ml-2 font-normal">{new Date(neg.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <Link
                    href={`/operator-terminal?contactId=${neg.contact.id}`}
                    className="col-span-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center"
                  >
                    <Phone className="w-4 h-4 mr-2" /> Chiama Ora
                  </Link>
                  <button
                    onClick={() => {
                      setAppointmentContactId(neg.contact.id);
                      setAppointmentContactCap(neg.contact.cap);
                      setAppointmentModalOpen(true);
                    }}
                    className="col-span-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" /> Fissa Appuntamento
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
