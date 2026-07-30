"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PlusCircle, X, AlertTriangle, Check, ArrowRight } from "lucide-react";

export default function CreateContactModal({ onCreated }: { onCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fuzzyMatch, setFuzzyMatch] = useState<{ id: string; name: string; cap: string; isBlocked: boolean; blockReason: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    cap: "",
    phone: "",
    sector: "",
    isNotInterested: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const resetForm = () => {
    setFormData({ name: "", cap: "", phone: "", sector: "", isNotInterested: false });
    setFuzzyMatch(null);
    setIsOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent, ignoreFuzzy = false) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contacts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, ignoreFuzzy }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(formData.isNotInterested ? "Contatto creato e contrassegnato non interessato!" : "Contatto creato e assegnato!");
        resetForm();
        if (onCreated) onCreated();
      } else if (res.status === 409 && data.fuzzyMatch) {
        // Trovato doppione simile
        setFuzzyMatch(data.contact);
      } else {
        toast.error(data.error || "Errore durante la creazione");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExisting = async () => {
    if (!fuzzyMatch) return;
    if (fuzzyMatch.isBlocked) {
      toast.error("Impossibile acquisire: il contatto è bloccato.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/contacts/manual/assign-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: fuzzyMatch.id }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Contatto esistente assegnato a te con successo!");
        resetForm();
        if (onCreated) onCreated();
      } else {
        toast.error(data.error || "Errore durante l'assegnazione");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1 transition underline underline-offset-4"
      >
        <PlusCircle className="w-4 h-4 mr-1.5" />
        Inserisci Manualmente Nuovo Cliente
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="text-lg font-semibold text-white">
                {fuzzyMatch ? "Possibile Doppione Trovato" : "Inserisci Nuovo Contatto"}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {fuzzyMatch ? (
                <div className="space-y-4">
                  <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-200 mb-1">
                          Nel sistema esiste già un contatto nel CAP <b>{fuzzyMatch.cap}</b> con un nome molto simile:
                        </p>
                        <p className="text-lg font-bold text-white mb-3">"{fuzzyMatch.name}"</p>
                        
                        {fuzzyMatch.isBlocked ? (
                          <div className="bg-red-900/40 border border-red-500/50 p-2 rounded text-xs text-red-200">
                            <strong>Attenzione:</strong> Questo contatto non può essere lavorato ({fuzzyMatch.blockReason}).
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-500/30 p-2 rounded">
                            Il contatto è libero e può essere lavorato.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 font-medium text-center">
                    Si tratta della stessa azienda?
                  </p>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleAssignExisting}
                      disabled={loading || fuzzyMatch.isBlocked}
                      className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 mr-2" /> 
                      Sì, è lo stesso (Assegna a me)
                    </button>
                    
                    <button
                      onClick={() => handleSubmit(undefined, true)}
                      disabled={loading}
                      className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded transition disabled:opacity-50"
                    >
                      No, è un'azienda diversa (Ignora e Crea)
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Ragione Sociale (Azienda)</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Es. Mario Rossi srl"
                    />
                    <p className="text-xs text-gray-500 mt-1">L'anti-doppione ignorerà "srl", "spa" ecc. e controllerà eventuali somiglianze.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">CAP</label>
                      <input
                        type="text"
                        name="cap"
                        required
                        value={formData.cap}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Es. 00100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Telefono (Opzionale)</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Settore (Opzionale)</label>
                    <input
                      type="text"
                      name="sector"
                      value={formData.sector}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Es. Ristorazione"
                    />
                  </div>

                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      id="isNotInterested"
                      name="isNotInterested"
                      checked={formData.isNotInterested}
                      onChange={(e) => setFormData({ ...formData, isNotInterested: e.target.checked })}
                      className="w-4 h-4 rounded text-red-500 bg-gray-900 border-gray-600 focus:ring-red-500"
                    />
                    <label htmlFor="isNotInterested" className="ml-2 text-sm text-gray-300 font-semibold cursor-pointer select-none">
                      Non Interessato (Nascondi per 60 giorni)
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-400 hover:text-white transition"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded transition disabled:opacity-50"
                    >
                      {loading ? "Verifica e Crea..." : "Crea e Lavora Subito"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
