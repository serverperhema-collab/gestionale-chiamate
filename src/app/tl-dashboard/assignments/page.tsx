"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Users, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OperatorAssignment {
  id: string;
  name: string;
  username: string;
  assignment: {
    cap: string;
    campaign: "PULIZIE" | "PERSONALE_HEMA" | "ENTRAMBI";
  } | null;
}

function OperatorRow({ op, onUpdate }: { op: OperatorAssignment, onUpdate: (id: string, cap: string, camp: string) => void }) {
  const [localCap, setLocalCap] = useState(op.assignment?.cap || "");
  const [localCampaign, setLocalCampaign] = useState(op.assignment?.campaign || "PULIZIE");

  const isChanged = localCap !== (op.assignment?.cap || "") || localCampaign !== (op.assignment?.campaign || "PULIZIE");

  return (
    <tr className="border-b border-gray-700/50 hover:bg-gray-750 transition">
      <td className="p-4">
        <div className="font-medium text-white">{op.name}</div>
        <div className="text-xs text-gray-500">@{op.username}</div>
      </td>
      <td className="p-4">
        <input
          type="text"
          value={localCap}
          onChange={(e) => setLocalCap(e.target.value)}
          placeholder="Inserisci CAP o Zone (separati da virgola)"
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
        />
      </td>
      <td className="p-4">
        <select
          value={localCampaign}
          onChange={(e) => setLocalCampaign(e.target.value as any)}
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="PULIZIE">Pulizie</option>
          <option value="PERSONALE_HEMA">Personale HEMA</option>
          <option value="ENTRAMBI">Entrambi</option>
        </select>
      </td>
      <td className="p-4 text-center">
        <button
          onClick={() => onUpdate(op.id, localCap, localCampaign)}
          disabled={!isChanged || localCap.trim() === ""}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Salva Assegnazione"
        >
          <Save className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}

export default function AssignmentsPage() {
  const [operators, setOperators] = useState<OperatorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/assignments");
      const data = await res.json();
      setOperators(data);
    } catch (error) {
      toast.error("Errore nel caricamento delle assegnazioni");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (userId: string, cap: string, campaign: string) => {
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cap, campaign })
      });

      if (res.ok) {
        toast.success("Assegnazione salvata");
        fetchAssignments();
      } else {
        toast.error("Errore durante il salvataggio");
      }
    } catch (error) {
      toast.error("Errore di rete");
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Caricamento...</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="mb-8 flex items-center space-x-4">
        <Link href="/tl-dashboard" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-white flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-400" />
            Assegnazione Mattutina
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Assegna i CAP e le Campagne agli Operatori per filtrare il loro calderone oggi.
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 border-b border-gray-700">
              <th className="p-4 font-medium text-gray-400">Operatore</th>
              <th className="p-4 font-medium text-gray-400 w-1/3">CAP (es. 00100, 00101)</th>
              <th className="p-4 font-medium text-gray-400 w-1/4">Campagna</th>
              <th className="p-4 font-medium text-gray-400 w-24 text-center">Azione</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((op) => (
              <OperatorRow key={op.id} op={op} onUpdate={handleUpdate} />
            ))}
            {operators.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Nessun operatore attivo trovato. Crea un account operatore prima di assegnare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
