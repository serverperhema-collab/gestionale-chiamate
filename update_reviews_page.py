# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/tl-dashboard/settings/reviews/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add handleDerogaAction
target1 = '''  const handleAction = async (id: string, action: "RESTORE" | "BLACKLIST") => {'''
replacement1 = '''  const [rescheduleData, setRescheduleData] = useState<{id: string, date: string, time: string} | null>(null);

  const handleDerogaAction = async (id: string, action: "DEROGA_ACCEPT" | "DEROGA_REJECT" | "DEROGA_RESCHEDULE", newDate?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/tl/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, newDate })
      });
      if (res.ok) {
        toast.success(action === "DEROGA_ACCEPT" ? "Approvato!" : action === "DEROGA_REJECT" ? "Rifiutato!" : "Spostato e approvato!");
        setReviews(reviews.filter(r => r.id !== id));
        if (action === "DEROGA_RESCHEDULE") setRescheduleData(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAction = async (id: string, action: "RESTORE" | "BLACKLIST") => {'''
code = code.replace(target1, replacement1)

# Modify render based on `rev.type === 'DEROGA'`
target2 = r'                  <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">\s*<button\s*onClick=\{\(\) => handleAction\(rev\.id, "RESTORE"\)\}'
replacement2 = '''                  {rev.type === 'DEROGA' ? (
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-800 mt-4">
                      {rescheduleData?.id === rev.id ? (
                        <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700 animate-in fade-in">
                          <p className="text-sm text-gray-300 mb-2 font-semibold">Scegli nuova data e ora:</p>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <input type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})} className="bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white" />
                            <input type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})} className="bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setRescheduleData(null)} className="flex-1 py-1.5 bg-gray-700 text-white rounded text-sm">Annulla</button>
                            <button onClick={() => handleDerogaAction(rev.id, "DEROGA_RESCHEDULE", `${rescheduleData.date}T${rescheduleData.time}:00.000Z`)} className="flex-1 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold">Conferma Spostamento</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDerogaAction(rev.id, "DEROGA_ACCEPT")}
                            disabled={processingId === rev.id}
                            className="flex-1 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Accetta
                          </button>
                          <button
                            onClick={() => {
                              const d = new Date(rev.date || new Date());
                              setRescheduleData({ id: rev.id, date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) });
                            }}
                            disabled={processingId === rev.id}
                            className="flex-1 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-4 h-4 mr-1.5" /> Sposta
                          </button>
                          <button
                            onClick={() => handleDerogaAction(rev.id, "DEROGA_REJECT")}
                            disabled={processingId === rev.id}
                            className="flex-1 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded transition text-sm font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" /> Rifiuta
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                      <button
                        onClick={() => handleAction(rev.id, "RESTORE")}'''
code = re.sub(target2, replacement2, code, count=1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")