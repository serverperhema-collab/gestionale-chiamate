"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PhoneCall, LogOut, FileText, ChevronRight, Handshake } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { signOut } from "next-auth/react";
import TrattativaTimeline from "@/components/TrattativaTimeline";

export default function OperatorNegotiations() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [trattative, setTrattative] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineId, setTimelineId] = useState<string | null>(null);
  
  // Tabs: 'personal-recall', 'appointment-recall', 'commercial-managing'
  const [activeTab, setActiveTab] = useState('personal-recall');

  const fetchTrattative = async () => {
    try {
      const res = await fetch("/api/trattative?operatorId=me");
      if (res.ok) {
        const data = await res.json();
        setTrattative(data.trattative || []);
      }
    } catch (err) {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrattative();
  }, []);

  const filteredTrattative = trattative.filter(st => {
    if (activeTab === 'personal-recall') return st.status === 'RICHIAMO_PERSONALE';
    if (activeTab === 'appointment-recall') return st.status === 'APPUNTAMENTO';
    
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-sm">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <PhoneCall className="w-5 h-5 text-blue-400" />
          <h1 className="font-bold text-gray-100 tracking-wide uppercase">LE MIE TRATTATIVE</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/operator-dashboard/tl-requests" className="px-3 py-1.5 bg-red-900/40 border border-red-800/50 hover:bg-red-800/60 text-sm text-red-200 rounded transition font-medium">
            Richieste TL
          </Link>
          <Link href="/operator-terminal" className="px-3 py-1.5 bg-blue-900/40 border border-blue-800/50 hover:bg-blue-800/60 text-sm text-blue-200 rounded transition font-medium">
            Torna alle chiamate
          </Link>
          <button onClick={() => signOut()} className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-gray-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-4 shrink-0 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">TRATTATIVE PERSONALI</h2>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('personal-recall')}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'personal-recall' ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
              >
                Da Richiamare
                {activeTab === 'personal-recall' && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">TRATTATIVE CON APPUNTAMENTO</h2>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('appointment-recall')}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center justify-between ${activeTab === 'appointment-recall' ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
              >
                Da Richiamare
                {activeTab === 'appointment-recall' && <ChevronRight className="w-4 h-4" />}
              </button>
              
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto w-full">
          <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center uppercase">
                TRATTATIVE PERSONALI E APPUNTAMENTI
              </h1>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredTrattative.length === 0 ? (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
                <Handshake className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nessuna trattativa trovata</h3>
                <p className="text-gray-400">Non ci sono schede in questa categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTrattative.map((st) => {
                  const contact = st.contact;
                  let tagText = "RICHIAMO PERSONALE";
                  let tagColor = "bg-purple-600";
                  
                  if (st.status === 'APPUNTAMENTO') {
                    tagText = "APPUNTAMENTO";
                    tagColor = "bg-blue-600";
                  }

                  return (
                    <div key={st.id} className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg relative flex flex-col overflow-hidden">
                      <div className={`${tagColor} px-4 py-2 text-center`}>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{tagText}</span>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                        <h3 className="font-bold text-lg text-white mb-6">{contact?.name || "Azienda Sconosciuta"}</h3>
                        
                        <button
                          onClick={() => setTimelineId(st.id)}
                          className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-bold text-xs flex items-center justify-center border border-gray-600 shadow mt-auto"
                        >
                          <FileText className="w-4 h-4 mr-2 text-gray-300" /> APRI SCHEDA TRATTATIVA
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {timelineId && (
        <TrattativaTimeline
          trattativaId={timelineId}
          onClose={() => {
             setTimelineId(null);
             fetchTrattative(); // Refresh if anything changed
          }}
        />
      )}
    </div>
  );
}
