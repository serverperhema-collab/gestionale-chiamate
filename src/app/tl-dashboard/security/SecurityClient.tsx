"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Unlock, AlertTriangle, Settings, Save, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function SecurityClient({ initialLockedUsers, allOperators }: { initialLockedUsers: any[], allOperators: any[] }) {
  const [users, setUsers] = useState(initialLockedUsers);
  const [operatorsSettings, setOperatorsSettings] = useState(allOperators);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedOperatorId, setExpandedOperatorId] = useState<string | null>(null);

  const handleUnlock = async (userId: string, type: "SKIP" | "MOD" | "NO_ANSWER" | "NOT_AVAILABLE" | "ALL" | "SUSPEND") => {
    setLoadingId(userId + type);
    try {
      const res = await fetch(`/api/users/${userId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        toast.success("Operatore sbloccato");
        setUsers(users.filter(u => {
          if (u.id !== userId) return true;
          // Se aveva due blocchi e ne sblocco uno, lo mantengo in lista
          if (type === "SKIP") {
             u.skipLockedUntil = null;
             u.skipCount = 0;
          }
          if (type === "MOD") {
             u.modLockedUntil = null;
          }
          if (type === "NO_ANSWER") {
             u.noAnswerLockedUntil = null;
          }
          if (type === "NOT_AVAILABLE") {
             u.notAvailableLockedUntil = null;
          }
          return u.skipLockedUntil || u.modLockedUntil || u.noAnswerLockedUntil || u.notAvailableLockedUntil; // Keep if still locked somehow
        }));
      } else {
        toast.error("Errore durante lo sblocco");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoadingId(null);
    }
  };

  // Global refresh listener
  useEffect(() => {
    const handleRefresh = () => {
      window.location.reload();
    };
    window.addEventListener("tl-refresh-data", handleRefresh);
    return () => window.removeEventListener("tl-refresh-data", handleRefresh);
  }, []);

  const suspendedUsers = users.filter((u: any) => u.isSuspended);
  const tempBlockedUsers = users.filter((u: any) => {
    if (u.isSuspended) return false;
    const isSkipLocked = u.skipLockedUntil && new Date(u.skipLockedUntil) > new Date();
    const isModLocked = u.modLockedUntil && new Date(u.modLockedUntil) > new Date();
    const isNoAnswerLocked = u.noAnswerLockedUntil && new Date(u.noAnswerLockedUntil) > new Date();
    const isNotAvailableLocked = u.notAvailableLockedUntil && new Date(u.notAvailableLockedUntil) > new Date();
    return isSkipLocked || isModLocked || isNoAnswerLocked || isNotAvailableLocked;
  });

  const handleOpenModal = (user: any, lockType: string, lockedUntil?: Date) => {
    if ((window as any).openTLBlockModal) {
      (window as any).openTLBlockModal({
        userId: user.id,
        userName: user.name,
        type: lockType,
        lockedUntil: lockedUntil || null
      });
    }
  };

  return (
    <div className="space-y-12">
      {/* SEZIONE OPERATORI SOSPESI */}
      {suspendedUsers.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="bg-red-600 w-3 h-8 rounded mr-3"></span>
            Operatori Sospesi a Tempo Indeterminato
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suspendedUsers.map((user: any) => (
              <div key={user.id} className="bg-gray-800 rounded-xl p-6 border border-red-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-red-900 rounded-bl-lg">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Sospeso</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-4">{user.name}</h3>
                
                <div className="space-y-3 mt-4">
                  <button
                    onClick={() => handleUnlock(user.id, "ALL")}
                    disabled={loadingId === user.id + "ALL"}
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition disabled:opacity-50"
                  >
                    <Unlock className="w-4 h-4 mr-2" /> Rimuovi Sospensione
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEZIONE OPERATORI BLOCCATI TEMPORANEAMENTE */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="bg-orange-500 w-3 h-8 rounded mr-3"></span>
          Operatori Bloccati Temporaneamente
        </h3>
        {tempBlockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-800 rounded-2xl border border-gray-700">
            <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nessun blocco temporaneo</h3>
            <p className="text-gray-400">Tutti gli operatori attivi possono operare regolarmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tempBlockedUsers.map((user: any) => {
              const isSkipLocked = user.skipLockedUntil && new Date(user.skipLockedUntil) > new Date();
              const isModLocked = user.modLockedUntil && new Date(user.modLockedUntil) > new Date();
              const isNoAnswerLocked = user.noAnswerLockedUntil && new Date(user.noAnswerLockedUntil) > new Date();
              const isNotAvailableLocked = user.notAvailableLockedUntil && new Date(user.notAvailableLockedUntil) > new Date();

              return (
                <div key={user.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 bg-orange-600 rounded-bl-lg">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">In Blocco</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4">{user.name}</h3>

                  <div className="space-y-4">
                    {isNoAnswerLocked && (
                      <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
                        <div className="flex items-center text-orange-400 font-semibold mb-2">
                          <AlertTriangle className="w-4 h-4 mr-2" /> "Non Risponde"
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Scade: {new Date(user.noAnswerLockedUntil).toLocaleTimeString()}</p>
                        <button
                          onClick={() => handleOpenModal(user, "NO_ANSWER", user.noAnswerLockedUntil)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium transition"
                        >
                          Dettagli Blocco
                        </button>
                      </div>
                    )}

                    {isNotAvailableLocked && (
                      <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
                        <div className="flex items-center text-orange-400 font-semibold mb-2">
                          <AlertTriangle className="w-4 h-4 mr-2" /> "Non Reperibile"
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Scade: {new Date(user.notAvailableLockedUntil).toLocaleTimeString()}</p>
                        <button
                          onClick={() => handleOpenModal(user, "NOT_AVAILABLE", user.notAvailableLockedUntil)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium transition"
                        >
                          Dettagli Blocco
                        </button>
                      </div>
                    )}

                    {isSkipLocked && (
                      <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
                        <div className="flex items-center text-orange-400 font-semibold mb-2">
                          <AlertTriangle className="w-4 h-4 mr-2" /> "Skip"
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Scade: {new Date(user.skipLockedUntil).toLocaleTimeString()}</p>
                        <button
                          onClick={() => handleOpenModal(user, "SKIP", user.skipLockedUntil)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium transition"
                        >
                          Dettagli Blocco
                        </button>
                      </div>
                    )}

                    {isModLocked && (
                      <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
                        <div className="flex items-center text-orange-400 font-semibold mb-2">
                          <AlertTriangle className="w-4 h-4 mr-2" /> "Modifiche Distruttive"
                        </div>
                        <p className="text-xs text-gray-400 mb-3">Scade: {new Date(user.modLockedUntil).toLocaleTimeString()}</p>
                        <button
                          onClick={() => handleOpenModal(user, "MOD_LOCK", user.modLockedUntil)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium transition"
                        >
                          Dettagli Blocco
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-3 text-blue-400" />
          Parametri Anti-Frode per Operatore
        </h3>
        
        <div className="space-y-4">
          {operatorsSettings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-800 rounded-xl border border-gray-700">Nessun operatore attivo.</div>
          ) : (
            operatorsSettings.map((op, index) => {
              const isExpanded = expandedOperatorId === op.id;
              
              return (
                <div key={op.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm transition-all duration-200">
                  <div 
                    onClick={() => setExpandedOperatorId(isExpanded ? null : op.id)}
                    className={`flex items-center justify-between p-5 cursor-pointer hover:bg-gray-750 transition-colors ${isExpanded ? 'bg-gray-750 border-b border-gray-700' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold mr-4 border border-blue-500/30">
                        {op.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-lg text-white">{op.name}</span>
                    </div>
                    <button className={`text-gray-400 hover:text-white transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-6 bg-gray-900/30 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        
                        {/* Blocco Non Risponde */}
                        <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg">
                          <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                            <div className="flex items-center text-gray-300 font-semibold">
                              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" /> Blocco "Non Risponde"
                            </div>
                            <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer hover:text-white transition">
                              <input 
                                type="checkbox"
                                checked={op.alertNoAnswerLock}
                                onChange={(e) => {
                                  const newArr = [...operatorsSettings];
                                  newArr[index].alertNoAnswerLock = e.target.checked;
                                  setOperatorsSettings(newArr);
                                }}
                                className="w-3.5 h-3.5 accent-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span>Avvisami tramite alert</span>
                            </label>
                          </div>
                          <div className="text-sm text-gray-400 leading-relaxed flex flex-wrap items-center gap-2">
                            <span>Se effettua più di</span>
                            <input 
                              type="number" min="0" value={op.maxNoAnswer}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxNoAnswer = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span>esiti in</span>
                            <input 
                              type="number" min="0" value={op.maxNoAnswerMins}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxNoAnswerMins = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span>minuti</span>
                            <div className="w-full h-2"></div>
                            <span>&rarr; Blocca operatore per</span>
                            <input 
                              type="number" min="0" value={op.noAnswerLockTime}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].noAnswerLockTime = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-red-900/30 border border-red-500/50 rounded px-2 py-1 text-center text-red-300 focus:outline-none focus:border-red-400 font-bold"
                            />
                            <span>minuti.</span>
                          </div>
                        </div>

                        {/* Blocco Non Reperibile */}
                        <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg">
                          <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                            <div className="flex items-center text-gray-300 font-semibold">
                              <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" /> Blocco "Non Reperibile"
                            </div>
                            <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer hover:text-white transition">
                              <input 
                                type="checkbox"
                                checked={op.alertNotAvailableLock}
                                onChange={(e) => {
                                  const newArr = [...operatorsSettings];
                                  newArr[index].alertNotAvailableLock = e.target.checked;
                                  setOperatorsSettings(newArr);
                                }}
                                className="w-3.5 h-3.5 accent-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span>Avvisami tramite alert</span>
                            </label>
                          </div>
                          <div className="text-sm text-gray-400 leading-relaxed flex flex-wrap items-center gap-2">
                            <span>Se effettua più di</span>
                            <input 
                              type="number" min="0" value={op.maxNotAvailable}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxNotAvailable = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span>esiti in</span>
                            <input 
                              type="number" min="0" value={op.maxNotAvailableMins}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxNotAvailableMins = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span>minuti</span>
                            <div className="w-full h-2"></div>
                            <span>&rarr; Blocca operatore per</span>
                            <input 
                              type="number" min="0" value={op.notAvailableLockTime}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].notAvailableLockTime = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-red-900/30 border border-red-500/50 rounded px-2 py-1 text-center text-red-300 focus:outline-none focus:border-red-400 font-bold"
                            />
                            <span>minuti.</span>
                          </div>
                        </div>

                        {/* Blocco Skip */}
                        <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg">
                          <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                            <div className="flex items-center text-gray-300 font-semibold">
                              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Blocco "Skip"
                            </div>
                            <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer hover:text-white transition">
                              <input 
                                type="checkbox"
                                checked={op.alertSkipLock}
                                onChange={(e) => {
                                  const newArr = [...operatorsSettings];
                                  newArr[index].alertSkipLock = e.target.checked;
                                  setOperatorsSettings(newArr);
                                }}
                                className="w-3.5 h-3.5 accent-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span>Avvisami tramite alert</span>
                            </label>
                          </div>
                          <div className="text-sm text-gray-400 leading-relaxed flex flex-wrap items-center gap-2">
                            <span>Se salta più di</span>
                            <input 
                              type="number" min="0" value={op.maxSkip}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxSkip = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span>contatti in</span>
                            <input 
                              type="number" min="0" value={op.maxSkipMins}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxSkipMins = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span>minuti</span>
                            <div className="w-full h-2"></div>
                            <span>&rarr; Blocca operatore per</span>
                            <input 
                              type="number" min="0" value={op.skipLockTime}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].skipLockTime = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-red-900/30 border border-red-500/50 rounded px-2 py-1 text-center text-red-300 focus:outline-none focus:border-red-400 font-bold"
                            />
                            <span>minuti.</span>
                          </div>
                        </div>

                        {/* Blocco Inattività Globale */}
                        <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg">
                          <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                            <div className="flex items-center text-gray-300 font-semibold">
                              <Clock className="w-4 h-4 mr-2 text-blue-500" /> Inattività Massima
                            </div>
                            <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer hover:text-white transition">
                              <input 
                                type="checkbox"
                                checked={op.alertIdleLock}
                                onChange={(e) => {
                                  const newArr = [...operatorsSettings];
                                  newArr[index].alertIdleLock = e.target.checked;
                                  setOperatorsSettings(newArr);
                                }}
                                className="w-3.5 h-3.5 accent-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span>Avvisami tramite alert</span>
                            </label>
                          </div>
                          <div className="text-sm text-gray-400 leading-relaxed flex flex-wrap items-center gap-2">
                            <span>Disconnetti l'operatore se rimane inattivo per più di</span>
                            <input 
                              type="number" min="0" value={op.maxIdleTimeMins}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxIdleTimeMins = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-blue-900/30 border border-blue-500/50 rounded px-2 py-1 text-center text-blue-300 focus:outline-none focus:border-blue-400 font-bold"
                            />
                            <span>minuti consecutivi.</span>
                          </div>
                        </div>

                        {/* Blocco Modifiche Distruttive */}
                        <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg md:col-span-2">
                          <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                            <div className="flex items-center text-gray-300 font-semibold">
                              <AlertTriangle className="w-4 h-4 mr-2 text-cyan-500" /> Blocco "Modifiche Distruttive"
                            </div>
                            <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer hover:text-white transition">
                              <input 
                                type="checkbox"
                                checked={op.alertModLock}
                                onChange={(e) => {
                                  const newArr = [...operatorsSettings];
                                  newArr[index].alertModLock = e.target.checked;
                                  setOperatorsSettings(newArr);
                                }}
                                className="w-3.5 h-3.5 accent-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span>Avvisami tramite alert</span>
                            </label>
                          </div>
                          <div className="text-sm text-gray-400 leading-relaxed flex flex-wrap items-center gap-2">
                            <span>Se altera più di</span>
                            <input 
                              type="number" min="0" value={op.maxDailyModifications}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxDailyModifications = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-cyan-500 font-bold"
                            />
                            <span>campi esistenti nello stesso giorno</span>
                            <div className="w-full h-2"></div>
                            <span>&rarr; Blocca modifiche operatore per</span>
                            <input 
                              type="number" min="0" value={op.modLockTimeMins}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].modLockTimeMins = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-cyan-900/30 border border-cyan-500/50 rounded px-2 py-1 text-center text-cyan-300 focus:outline-none focus:border-cyan-400 font-bold"
                            />
                            <span>minuti.</span>
                          </div>
                        </div>

                        {/* Budget Appuntamenti in Deroga */}
                        <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg md:col-span-2">
                          <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                            <div className="flex items-center text-gray-300 font-semibold">
                              <svg className="w-4 h-4 mr-2 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Budget Appuntamenti in Deroga
                            </div>
                            <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer hover:text-white transition">
                              <input 
                                type="checkbox"
                                checked={op.alertDeroghe}
                                onChange={(e) => {
                                  const newArr = [...operatorsSettings];
                                  newArr[index].alertDeroghe = e.target.checked;
                                  setOperatorsSettings(newArr);
                                }}
                                className="w-3.5 h-3.5 accent-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <span>Avvisami tramite alert</span>
                            </label>
                          </div>
                          <div className="text-sm text-gray-400 leading-relaxed flex flex-wrap items-center gap-2">
                            <span>L'operatore può forzare al massimo</span>
                            <input 
                              type="number" min="0" value={op.maxDeroghe}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxDeroghe = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-purple-900/30 border border-purple-500/50 rounded px-2 py-1 text-center text-purple-300 focus:outline-none focus:border-purple-400 font-bold"
                            />
                            <span>appuntamenti in deroga ogni</span>
                            <input 
                              type="number" min="0" value={op.maxDerogheHours}
                              onChange={(e) => {
                                const newArr = [...operatorsSettings];
                                newArr[index].maxDerogheHours = parseInt(e.target.value) || 0;
                                setOperatorsSettings(newArr);
                              }}
                              className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-blue-500 font-bold"
                            />
                            <span>ore.</span>
                          </div>
                        </div>

                      </div>

                      {/* Operatore Fidato Toggle */}
                      <div className="bg-gray-800 border border-emerald-900/30 p-5 rounded-lg mt-4 flex items-center justify-between shadow-sm">
                        <div>
                          <h4 className="text-emerald-400 font-bold flex items-center mb-1">
                            ⭐ Operatore Fidato (Immunità e Auto-Approvazione)
                          </h4>
                          <p className="text-sm text-gray-400">
                            Se attivo, l'operatore non subirà mai blocchi (Skip, KO, Modifiche) e le sue richieste (Cestino, Gestione Separata) saranno approvate istantaneamente senza creare code di notifica per il TL.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                          <input 
                            type="checkbox" 
                            checked={op.isTrusted || false}
                            onChange={(e) => {
                              const newArr = [...operatorsSettings];
                              newArr[index].isTrusted = e.target.checked;
                              setOperatorsSettings(newArr);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                      {/* Azione Salva */}
                      <div className="flex justify-end pt-4 border-t border-gray-800">
                        <button
                          onClick={async () => {
                            setLoadingId("SAVE_" + op.id);
                            try {
                              const res = await fetch(`/api/users/${op.id}/settings`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  maxNoAnswer: op.maxNoAnswer, 
                                  maxNoAnswerMins: op.maxNoAnswerMins,
                                  noAnswerLockTime: op.noAnswerLockTime,
                                  maxSkip: op.maxSkip,
                                  maxSkipMins: op.maxSkipMins,
                                  skipLockTime: op.skipLockTime,
                                  maxNotAvailable: op.maxNotAvailable,
                                  maxNotAvailableMins: op.maxNotAvailableMins,
                                  notAvailableLockTime: op.notAvailableLockTime,
                                  maxIdleTimeMins: op.maxIdleTimeMins,
                                  maxDeroghe: op.maxDeroghe,
                                  maxDerogheHours: op.maxDerogheHours,
                                  alertNoAnswerLock: op.alertNoAnswerLock,
                                  alertNotAvailableLock: op.alertNotAvailableLock,
                                  alertSkipLock: op.alertSkipLock,
                                  alertIdleLock: op.alertIdleLock,
                                  alertDeroghe: op.alertDeroghe,
                                  alertModLock: op.alertModLock,
                                  maxDailyModifications: op.maxDailyModifications,
                                  modLockTimeMins: op.modLockTimeMins
                                })
                              });
                              if (res.ok) toast.success("Impostazioni salvate per " + op.name);
                              else toast.error("Errore nel salvataggio");
                            } catch(e) {
                              toast.error("Errore di rete");
                            } finally {
                              setLoadingId(null);
                            }
                          }}
                          disabled={loadingId === "SAVE_" + op.id}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center shadow-lg shadow-blue-900/20"
                        >
                          {loadingId === "SAVE_" + op.id ? (
                            "Salvataggio..."
                          ) : (
                            <><Save className="w-5 h-5 mr-2" /> Salva Impostazioni Operatore</>
                          )}
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
