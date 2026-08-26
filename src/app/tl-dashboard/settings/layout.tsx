"use client";

import Link from "next/link";
import { Settings, Trash2, MapPin, ArrowLeft, Database, Users, EyeOff, ClipboardList } from "lucide-react";
import { usePathname } from "next/navigation";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 p-8 bg-gray-900 min-h-screen text-gray-100 flex flex-col">
      <div className="mb-6">
        <Link href="/tl-dashboard" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
            <Settings className="w-6 h-6 mr-3 text-amber-500" />
            Configurazioni & Utility
          </h2>
          <p className="text-gray-400 mt-1">
            Gestisci le mappature, il cestino e altre configurazioni di sistema.
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-8 max-w-7xl w-full">
        {/* SIDE MENU */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden sticky top-8">
            <Link
              href="/tl-dashboard/settings"
              className={`w-full flex items-center p-4 text-left transition ${pathname === "/tl-dashboard/settings" ? "bg-amber-900/30 text-amber-400 border-l-4 border-amber-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"}`}
            >
              <MapPin className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Mappatura CAP</span>
            </Link>
            <Link
              href="/extract"
              className={`w-full flex items-center p-4 text-left transition text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent border-t border-t-gray-700`}
            >
              <Database className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Estrazione Avanzata (Nuova)</span>
            </Link>
            <Link
              href="/tl-dashboard/settings/users"
              className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/users") ? "bg-amber-900/30 text-amber-400 border-l-4 border-amber-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent border-t border-t-gray-700"}`}
            >
              <Users className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Gestione Account</span>
            </Link>
            <Link
              href="/tl-dashboard/settings/contacts"
              className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/contacts") && !pathname?.includes("hidden") ? "bg-amber-900/30 text-amber-400 border-l-4 border-amber-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent border-t border-t-gray-700"}`}
            >
              <Database className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Contatti (Database)</span>
            </Link>
            <Link
              href="/tl-dashboard/settings/hidden-contacts"
              className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/hidden-contacts") ? "bg-amber-900/30 text-amber-400 border-l-4 border-amber-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent border-t border-t-gray-700"}`}
            >
              <EyeOff className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Contatti Nascosti</span>
            </Link>
            <Link
              href="/tl-dashboard/settings/reviews"
              className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/reviews") ? "bg-amber-900/30 text-amber-400 border-l-4 border-amber-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent border-t border-t-gray-700"}`}
            >
              <ClipboardList className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Notifiche da Gestire</span>
            </Link>
            <Link
              href="/tl-dashboard/settings/deletions"
              className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/deletions") ? "bg-amber-900/30 text-amber-400 border-l-4 border-amber-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent border-t border-t-gray-700"}`}
            >
              <Trash2 className="w-5 h-5 mr-3" />
              <span className="font-semibold text-sm">Cestino</span>
            </Link>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
