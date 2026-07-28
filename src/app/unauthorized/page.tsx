import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-red-900/50 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Accesso Negato</h1>
        <p className="text-gray-400 mb-6">
          Non hai i permessi necessari per visualizzare questa pagina. Il tuo ruolo non è autorizzato.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
        >
          Torna alla tua Dashboard
        </Link>
      </div>
    </div>
  );
}
