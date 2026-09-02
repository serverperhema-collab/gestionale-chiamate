import sys

path = 'src/components/ContactDetailModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Make the normal modal content hidden when printing
content_target = '<div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:bg-white print:border-none print:shadow-none print:max-w-full print:h-auto print:max-h-full print:overflow-visible text-white print:text-black">'
content_replacement = '<div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:hidden">'

code = code.replace(content_target, content_replacement)

# Create the print layout
print_layout = """
      {/* PRINT LAYOUT */}
      {data && (
        <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white text-black p-8 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-amber-500 pb-4">
            <div className="flex items-center">
              <div className="text-6xl font-serif text-amber-500 mr-2 border-r-2 border-amber-500 pr-4 leading-none">H</div>
              <div className="text-4xl font-serif text-slate-800 tracking-widest leading-none">HEMA</div>
            </div>
            <div className="text-right">
              <div className="bg-slate-900 text-white font-bold tracking-widest px-8 py-2 text-xl inline-block" style={{ transform: "skewX(-15deg)" }}>
                <span className="block" style={{ transform: "skewX(15deg)" }}>SCHEDA APPUNTAMENTO</span>
              </div>
              <div className="text-amber-600 font-bold text-2xl mt-2">{data.name}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex justify-between mb-8 px-4 text-slate-600">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-slate-400" />
              <div>
                <div className="text-xs font-bold tracking-wider uppercase">Data Stampa</div>
                <div className="font-medium text-slate-800">{new Date().toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="w-6 h-6 mr-3 text-slate-400" />
              <div>
                <div className="text-xs font-bold tracking-wider uppercase">ID Appuntamento</div>
                <div className="font-medium text-slate-800 font-mono text-amber-600">{data.appointments?.[0]?.id?.slice(-8).toUpperCase() || "N/D"}</div>
              </div>
            </div>
          </div>

          {/* Dati Principali */}
          <div className="mb-6">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <User className="w-4 h-4 mr-2" /> DATI PRINCIPALI
            </div>
            <div className="border border-slate-200 rounded-xl p-6 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <div className="text-[150px] font-serif text-slate-900 leading-none">H</div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Ragione Sociale</div>
                  <div className="w-3/4 font-bold text-amber-600 text-lg">{data.name}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Indirizzo</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.address || "-"} ({data.cap || "-"})</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Telefono</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.originalPhone || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Riepilogo Appuntamento */}
          <div className="mb-6">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <Calendar className="w-4 h-4 mr-2" /> RIEPILOGO APPUNTAMENTO
            </div>
            <div className="border border-slate-200 rounded-xl p-6 relative overflow-hidden">
              {/* Watermark */}
              <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <Calendar className="w-40 h-40 text-slate-900" />
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Data Appuntamento</div>
                  <div className="w-3/4 font-bold text-slate-800">{data.appointments?.[0] ? new Date(data.appointments[0].date).toLocaleString() : "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Stato</div>
                  <div className="w-3/4 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-max">{data.appointments?.[0]?.status || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Comm. Referente</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.commerciale?.name || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-3">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Op. Team Leader</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.operator?.name || "N/D"}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-sm">Esigenze / Note</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.clientNeeds || "Nessuna specifica"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dettagli e Note */}
          <div className="mb-6">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <FileText className="w-4 h-4 mr-2" /> DETTAGLI E NOTE
            </div>
            <div className="border border-slate-200 rounded-xl p-6">
              <div className="mb-4">
                <div className="font-bold text-slate-700 mb-2 flex items-center text-sm"><FileText className="w-4 h-4 mr-2" /> NOTE TL</div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800 text-sm italic">
                  {data.appointments?.[0]?.tlNotes || "Nessuna nota aggiuntiva dal Team Leader."}
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-700 mb-2 flex items-center text-sm"><Clock className="w-4 h-4 mr-2" /> STORICO ATTIVITÀ</div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-800 text-sm">
                  {data.appointments?.[0]?.outcomes?.map((out: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                       <div className="flex items-center"><div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div><span className="font-bold mr-2">{out.status}</span> <span>{out.notes}</span></div>
                     </div>
                  ))}
                  {(!data.appointments?.[0]?.outcomes || data.appointments[0].outcomes.length === 0) && "Nessun esito registrato."}
                </div>
              </div>
            </div>
          </div>

          {/* Prossimi Passi (Static as requested in design) */}
          <div className="mb-12">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-xl rounded-br-xl mb-2 font-bold text-sm tracking-widest">
              <CheckCircle className="w-4 h-4 mr-2" /> PROSSIMI PASSI CONSIGLIATI
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="flex items-start p-4 border border-slate-100 rounded-lg">
                <FileText className="w-8 h-8 text-slate-400 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-800">Preparare proposta</div>
                  <div className="text-xs text-slate-500">Analizzare le esigenze espresse</div>
                </div>
              </div>
              <div className="flex items-start p-4 border border-slate-100 rounded-lg">
                <Phone className="w-8 h-8 text-slate-400 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-800">Follow-up telefonico</div>
                  <div className="text-xs text-slate-500">Entro 2 giorni lavorativi</div>
                </div>
              </div>
              <div className="flex items-start p-4 border border-slate-100 rounded-lg">
                <CheckCircle className="w-8 h-8 text-slate-400 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-800">Inviare documentazione</div>
                  <div className="text-xs text-slate-500">Listino e presentazione servizi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl text-xs">
            <div className="italic text-amber-500 font-serif text-sm px-4">"La cura del dettaglio fa la differenza"</div>
            <div className="text-slate-400 text-right">
              <div>Sistema di Gestione - {data.name}</div>
              <div>Documento generato automaticamente</div>
            </div>
          </div>

        </div>
      )}
"""

code = code.replace('    </div>\n  );\n}', print_layout + '    </div>\n  );\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
