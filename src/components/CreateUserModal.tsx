"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, X, Printer } from "lucide-react";

export default function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{username: string, password: string, role: string} | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "OPERATORE",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Account ${formData.role} creato!`);
        setCreatedUser({ username: formData.username, password: formData.password, role: formData.role });
        setFormData({ name: "", username: "", password: "", role: "OPERATORE" });
      } else {
        toast.error(data.error || "Errore durante la creazione");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!createdUser) return;
    const printWindow = window.open('', '', 'height=500,width=500');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Credenziali Accesso</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; color: #111; }
              .card { border: 2px dashed #333; padding: 30px; border-radius: 12px; max-width: 400px; margin: 0 auto; }
              h1 { font-size: 20px; margin-top: 0; margin-bottom: 20px; text-align: center; }
              p { font-size: 16px; margin: 10px 0; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Credenziali Gestionale CRM</h1>
              <p><strong>Ruolo:</strong> ${createdUser.role}</p>
              <p><strong>Link:</strong> ${typeof window !== 'undefined' ? window.location.origin : ''}/login</p>
              <p><strong>Username:</strong> ${createdUser.username}</p>
              <p><strong>Password:</strong> ${createdUser.password}</p>
              <div class="footer">Conserva questo foglio in un luogo sicuro.</div>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg border border-gray-600 transition"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Nuovo Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="text-lg font-semibold text-white">Crea Nuovo Utente</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {createdUser ? (
                <div className="text-center space-y-4">
                  <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4 text-left">
                    <p className="text-emerald-400 font-medium mb-2">✅ Account creato con successo!</p>
                    <p className="text-gray-300 text-sm mb-1">Copia queste credenziali e inviale al dipendente:</p>
                    <div className="bg-black/50 p-3 rounded text-sm font-mono text-gray-200 select-all">
                      Link: {typeof window !== 'undefined' ? window.location.origin : ''}/login<br/>
                      Username: {createdUser.username}<br/>
                      Password: {createdUser.password}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePrint}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded transition flex-1 flex items-center justify-center"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Stampa
                    </button>
                    <button
                      onClick={() => {
                        setCreatedUser(null);
                        setIsOpen(false);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition flex-1"
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nome e Cognome</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Ruolo</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="OPERATORE">Operatore</option>
                        <option value="COMMERCIALE">Commerciale</option>
                        <option value="TEAM_LEADER">Team Leader</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Password Iniziale</label>
                      <input
                        type="text"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition disabled:opacity-50"
                    >
                      {loading ? "Creazione..." : "Salva Utente"}
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
