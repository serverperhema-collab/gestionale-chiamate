"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { XCircle, AlertTriangle, Unlock, UserX } from "lucide-react";

export default function TLAlertProvider() {
  const alertedLocksRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();

  const [activeModalAlert, setActiveModalAlert] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Play audio function
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio not supported or blocked");
    }
  };

  useEffect(() => {
    if (!pathname?.startsWith("/tl-dashboard")) return;

    let intervalId: NodeJS.Timeout;

    const checkAlerts = async () => {
      // Non mostrare nuovi popup se ce n'è già uno aperto
      if (activeModalAlert) return;

      try {
        const res = await fetch("/api/tl/alerts-status");
        if (!res.ok) return;
        
        const data = await res.json();
        if (!data.alerts || !Array.isArray(data.alerts)) return;

        for (const alert of data.alerts) {
          const alertKey = `${alert.userId}-${alert.type}-${alert.lockedUntil}`;
          
          if (!alertedLocksRef.current.has(alertKey)) {
            alertedLocksRef.current.add(alertKey);
            setActiveModalAlert(alert);
            playAlertSound();
            break; // Mostra un popup alla volta
          }
        }
      } catch (err) {}
    };

    checkAlerts();
    intervalId = setInterval(checkAlerts, 15000);

    return () => clearInterval(intervalId);
  }, [pathname, activeModalAlert]);

  useEffect(() => {
    if (activeModalAlert) {
      // Fetch logs
      setLoadingLogs(true);
      fetch(`/api/tl/block-details?userId=${activeModalAlert.userId}&type=${activeModalAlert.type}`)
        .then(r => r.json())
        .then(d => {
          if (d.logs) setLogs(d.logs);
        })
        .finally(() => setLoadingLogs(false));
    } else {
      setLogs([]);
    }
  }, [activeModalAlert]);

  // Espone globalmente la funzione per aprire il modale dai dettagli
  useEffect(() => {
    (window as any).openTLBlockModal = (alertData: any) => {
      setActiveModalAlert(alertData);
    };
    return () => {
      delete (window as any).openTLBlockModal;
    };
  }, []);

  if (!activeModalAlert) return null;

  const lockTypeLabels: Record<string, string> = {
    'SKIP': 'Eccesso di Skip',
    'NO_ANSWER': 'Troppi Non Risponde',
    'NOT_AVAILABLE': 'Troppi Non Reperibile',
    'MOD_LOCK': 'Troppe Modifiche Distruttive'
  };

  const label = lockTypeLabels[activeModalAlert.type] || activeModalAlert.type;

  const handleUnlock = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${activeModalAlert.userId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeModalAlert.type })
      });
      if (res.ok) {
        toast.success("Operatore sbloccato con successo");
        setActiveModalAlert(null);
        // Dispatch an event to refresh data on the page
        window.dispatchEvent(new Event("tl-refresh-data"));
      } else {
        toast.error("Errore nello sblocco");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${activeModalAlert.userId}/suspend`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Operatore sospeso a tempo indeterminato");
        setActiveModalAlert(null);
        window.dispatchEvent(new Event("tl-refresh-data"));
      } else {
        toast.error("Errore nella sospensione");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-red-500/50 rounded-2xl w-full max-w-2xl shadow-2xl shadow-red-900/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-red-950/40 border-b border-red-900/50 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center text-red-400 font-bold text-lg">
            <AlertTriangle className="w-6 h-6 mr-3 text-red-500" />
            BLOCCO SICUREZZA: {activeModalAlert.userName}
          </div>
          <button 
            onClick={() => setActiveModalAlert(null)}
            className="text-gray-400 hover:text-white transition"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-gray-300 text-lg mb-6">
            L'operatore <strong className="text-white">{activeModalAlert.userName}</strong> è stato temporaneamente bloccato per: <strong className="text-red-400">{label}</strong>.
          </p>

          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Ultimi log rilevati</h3>
          
          <div className="space-y-3">
            {loadingLogs ? (
              <div className="text-center py-8 text-gray-500">Caricamento log...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-lg border border-gray-800">Nessun log recente trovato.</div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-200">{log.contactName}</span>
                    <span className="text-xs text-gray-500">{new Date(log.date).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-gray-400 italic bg-gray-900/50 p-2 rounded">
                    "{log.notes}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 px-6 flex justify-between items-center gap-4 flex-wrap">
          <button 
            onClick={() => setActiveModalAlert(null)}
            className="px-5 py-2.5 text-gray-400 hover:text-white transition font-medium"
          >
            Lascia bloccato
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleSuspend}
              disabled={actionLoading}
              className="flex items-center px-5 py-2.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/30 rounded-lg transition font-semibold disabled:opacity-50"
            >
              <UserX className="w-5 h-5 mr-2" />
              Sospendi Indefinitamente
            </button>
            <button
              onClick={handleUnlock}
              disabled={actionLoading}
              className="flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-semibold shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              <Unlock className="w-5 h-5 mr-2" />
              Sblocca e Resetta Count
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
