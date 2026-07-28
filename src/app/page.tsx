import { prisma } from "@/lib/prisma";
import { Users, Building2, DollarSign, Activity, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  let totalContacts = 0;
  let googleContacts = 0;
  let todayGoogleContacts = 0;
  let uniqueCaps = 0;
  let searchedCapsArray: string[] = [];

  try {
    totalContacts = await prisma.contact.count();
    
    googleContacts = await prisma.contact.count({
      where: { NOT: { placeId: { startsWith: 'osm/' } } }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    todayGoogleContacts = await prisma.contact.count({
      where: {
        createdAt: { gte: startOfToday },
        NOT: { placeId: { startsWith: 'osm/' } }
      }
    });

    const capsData = await prisma.contact.findMany({
      select: { cap: true },
      distinct: ['cap'],
    });
    uniqueCaps = capsData.length;
    searchedCapsArray = capsData.map(c => c.cap);

  } catch (e) {
    console.error("DB non ancora pronto o errore query");
  }

  // Costo per chiamata testo + dettagli è circa 0.032$ su Google Places API (Nuova versione)
  // Il calcolo preciso dipende dalla fascia, ma usiamo una media per la dashboard.
  const spesaTotale = (googleContacts * 0.032).toFixed(2);
  const spesaGiornaliera = (todayGoogleContacts * 0.032).toFixed(2);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contatti Estratti */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex items-center space-x-4 relative overflow-hidden">
          <div className="p-4 bg-blue-500/10 rounded-xl">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <div className="z-10">
            <p className="text-sm text-gray-400 font-medium">Contatti Estratti</p>
            <p className="text-3xl font-bold text-white">{totalContacts}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
        </div>

        {/* CAP Coperti */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex items-center space-x-4 relative overflow-hidden">
          <div className="p-4 bg-purple-500/10 rounded-xl">
            <MapIcon className="w-8 h-8 text-purple-400" />
          </div>
          <div className="z-10">
            <p className="text-sm text-gray-400 font-medium">CAP Coperti</p>
            <p className="text-3xl font-bold text-white">{uniqueCaps}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
        </div>

        {/* Spesa Totale */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex items-center space-x-4 relative overflow-hidden">
          <div className="p-4 bg-red-500/10 rounded-xl">
            <DollarSign className="w-8 h-8 text-red-400" />
          </div>
          <div className="z-10">
            <p className="text-sm text-gray-400 font-medium">Spesa Totale (Google API)</p>
            <p className="text-3xl font-bold text-white">${spesaTotale}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
        </div>

        {/* Spesa Giornaliera */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex items-center space-x-4 relative overflow-hidden">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Activity className="w-8 h-8 text-orange-400" />
          </div>
          <div className="z-10">
            <p className="text-sm text-gray-400 font-medium">Spesa Oggi (Google API)</p>
            <p className="text-3xl font-bold text-white">${spesaGiornaliera}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl"></div>
        </div>
      </div>
      
      {/* MAPPA INTERATTIVA A SCHEDE */}
      <DashboardClient searchedCaps={searchedCapsArray} />

      <div className="mt-12 bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl text-center relative overflow-hidden">
        <Building2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 relative z-10" />
        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Pronto per estrarre nuovi dati?</h2>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto relative z-10">
          Cerca aziende tramite CAP o Settore e salvale automaticamente all'interno di questo gestionale. Il sistema terrà conto di quali CAP hai già completato.
        </p>
        <Link href="/extract" className="relative z-10 inline-flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
          Avvia Nuova Estrazione
        </Link>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
