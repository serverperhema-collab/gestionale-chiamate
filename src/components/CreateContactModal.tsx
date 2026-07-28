"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PlusCircle, X } from "lucide-react";

export default function CreateContactModal({ onCreated }: { onCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cap: "",
    phone: "",
    sector: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contacts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Contatto creato e assegnato!");
        setFormData({ name: "", cap: "", phone: "", sector: "" });
        setIsOpen(false);
        if (onCreated) onCreated();
      } else {
        toast.error(data.error || "Errore durante la creazione");
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
              <h3 className="text-lg font-semibold text-white">Inserisci Nuovo Contatto</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <p className="text-xs text-gray-500 mt-1">L'anti-doppione ignorerà "srl", "spa" ecc.</p>
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

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
