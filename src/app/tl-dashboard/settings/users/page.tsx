"use client";

import { useState, useEffect } from "react";
import { UserPlus, Save, XCircle, Users, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "OPERATORE"
  });
  
  const [editData, setEditData] = useState({
    name: "",
    password: "", // Only if they want to reset it
    role: "OPERATORE",
    isActive: true,
    maxDeroghe: 3,
    maxDerogheHours: 24
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Utente creato con successo!");
        setModalOpen(false);
        setFormData({ name: "", username: "", password: "", role: "OPERATORE" });
        fetchUsers();
      } else {
        toast.error(data.error || "Errore nella creazione dell'utente");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { 
        name: editData.name, 
        role: editData.role, 
        isActive: editData.isActive,
        maxDeroghe: Number(editData.maxDeroghe),
        maxDerogheHours: Number(editData.maxDerogheHours)
      };
      if (editData.password) {
        payload.password = editData.password;
      }

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Utente aggiornato con successo!");
        setEditModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || "Errore nell'aggiornamento dell'utente");
      }
    } catch (error) {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-950 text-gray-100">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-400" />
            Gestione Account
          </h2>
          <p className="text-gray-400 mt-1">
            Crea e visualizza gli account per gli Operatori, i Commerciali e le altre Team Leader.
          </p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium shadow-lg"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Crea Utente
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-700 text-sm font-medium text-gray-400 uppercase tracking-wider">
                <th className="p-4">Nome</th>
                <th className="p-4">Username</th>
                <th className="p-4">Ruolo</th>
                <th className="p-4">Stato</th>
                <th className="p-4">Creato il</th>
                <th className="p-4 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition">
                  <td className="p-4 font-medium text-white">{u.name}</td>
                  <td className="p-4 text-gray-300">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.role === 'TEAM_LEADER' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' :
                      u.role === 'COMMERCIALE' ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' :
                      'bg-blue-900/50 text-blue-300 border border-blue-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.isActive ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/50 text-red-400 border border-red-500/30'}`}>
                      {u.isActive ? 'Attivo' : 'Sospeso'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setEditData({
                          name: u.name,
                          password: "",
                          role: u.role,
                          isActive: u.isActive,
                          maxDeroghe: u.maxDeroghe ?? 3,
                          maxDerogheHours: u.maxDerogheHours ?? 24
                        });
                        setEditModalOpen(true);
                      }}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm transition"
                    >
                      Modifica
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nessun utente trovato</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Creazione Utente Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-blue-400" /> Nuovo Account
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Es. Mario Rossi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Es. m.rossi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Password di accesso"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Ruolo</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="OPERATORE">OPERATORE</option>
                  <option value="COMMERCIALE">COMMERCIALE</option>
                  <option value="TEAM_LEADER">TEAM LEADER</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                  Annulla
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-md disabled:opacity-50 flex items-center"
                >
                  {saving ? "Creazione..." : <><Save className="w-4 h-4 mr-2" /> Salva Utente</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modifica Utente Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                Modifica {selectedUser.username}
              </h3>
              <button onClick={() => {
                setEditModalOpen(false);
                setSelectedUser(null);
              }} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nuova Password (lascia vuoto per non cambiare)</label>
                <input 
                  type="password" 
                  value={editData.password}
                  onChange={e => setEditData({...editData, password: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="********"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Ruolo</label>
                <select 
                  value={editData.role}
                  onChange={e => setEditData({...editData, role: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="OPERATORE">OPERATORE</option>
                  <option value="COMMERCIALE">COMMERCIALE</option>
                  <option value="TEAM_LEADER">TEAM LEADER</option>
                </select>
              </div>

              {editData.role === "OPERATORE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Max Appuntamenti in Deroga</label>
                    <input 
                      type="number" 
                      min={0}
                      value={editData.maxDeroghe}
                      onChange={e => setEditData({...editData, maxDeroghe: parseInt(e.target.value) || 0})}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Entro un tempo di (Ore)</label>
                    <input 
                      type="number" 
                      min={1}
                      value={editData.maxDerogheHours}
                      onChange={e => setEditData({...editData, maxDerogheHours: parseInt(e.target.value) || 1})}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editData.isActive}
                  onChange={e => setEditData({...editData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-300">
                  Account Attivo (può fare login)
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => {
                  setEditModalOpen(false);
                  setSelectedUser(null);
                }} className="px-4 py-2 text-gray-400 hover:text-white transition">
                  Annulla
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-md disabled:opacity-50 flex items-center"
                >
                  {saving ? "Salvataggio..." : <><Save className="w-4 h-4 mr-2" /> Salva Modifiche</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
