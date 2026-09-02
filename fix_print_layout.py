import sys

path = 'src/components/ContactDetailModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# First, remove the old print layout
start_marker = "{/* PRINT LAYOUT */}"
end_marker = "      )}\n    </div>\n  );\n}"
if start_marker in code:
    start_idx = code.find(start_marker)
    end_idx = code.find(end_marker) + len("      )}\n")
    code = code[:start_idx] + code[end_idx:]

# Ensure modal doesn't have print:static etc
target = '<div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 print:static print:inset-auto print:bg-white print:p-0">'
replacement = '<div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">'
code = code.replace(target, replacement)

new_print_layout = """
      {/* PRINT LAYOUT */}
      {data && (
        <div id="print-layout" className="hidden print:flex flex-col w-[210mm] h-[292mm] bg-white text-black p-8 font-sans box-border overflow-hidden">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #print-layout, #print-layout * {
                visibility: visible;
              }
              #print-layout {
                position: absolute;
                left: 0;
                top: 0;
                margin: 0;
                padding: 10mm;
              }
              @page {
                size: A4 portrait;
                margin: 0;
              }
            }
          `}</style>
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-amber-500 pb-4 shrink-0">
            <div className="flex items-center">
              <div className="text-5xl font-serif text-amber-500 mr-2 border-r border-amber-500 pr-3 leading-none">H</div>
              <div className="text-3xl font-serif text-slate-800 tracking-widest leading-none">HEMA</div>
            </div>
            <div className="text-right">
              <div className="bg-slate-900 text-white font-bold tracking-widest px-6 py-1.5 text-lg inline-block" style={{ transform: "skewX(-15deg)" }}>
                <span className="block" style={{ transform: "skewX(15deg)" }}>SCHEDA APPUNTAMENTO</span>
              </div>
              <div className="text-amber-600 font-bold text-xl mt-1 truncate max-w-[100mm]">{data.name}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex justify-between mb-6 px-4 text-slate-600 shrink-0">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase">Data Stampa</div>
                <div className="font-medium text-slate-800 text-sm">{new Date().toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase">ID Appuntamento</div>
                <div className="font-medium text-slate-800 font-mono text-amber-600 text-sm">{data.appointments?.[0]?.id?.slice(-8).toUpperCase() || "N/D"}</div>
              </div>
            </div>
          </div>

          {/* Dati Principali */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <User className="w-3.5 h-3.5 mr-2" /> DATI PRINCIPALI
            </div>
            <div className="border border-slate-200 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                <div className="text-[120px] font-serif text-slate-900 leading-none">H</div>
              </div>
              
              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Ragione Sociale</div>
                  <div className="w-3/4 font-bold text-amber-600 text-base">{data.name}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Indirizzo</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.address || "-"} ({data.cap || "-"})</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Telefono</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.originalPhone || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Riepilogo Appuntamento */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <Calendar className="w-3.5 h-3.5 mr-2" /> RIEPILOGO APPUNTAMENTO
            </div>
            <div className="border border-slate-200 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                <Calendar className="w-24 h-24 text-slate-900" />
              </div>

              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Data Appuntamento</div>
                  <div className="w-3/4 font-bold text-slate-800">{data.appointments?.[0] ? new Date(data.appointments[0].date).toLocaleString() : "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Stato</div>
                  <div className="w-3/4 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-max text-xs">{data.appointments?.[0]?.status || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Comm. Referente</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.commerciale?.name || "N/D"}</div>
                </div>
                <div className="flex items-start border-b border-slate-100 pb-2">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Op. Team Leader</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.operator?.name || "N/D"}</div>
                </div>
                <div className="flex items-start">
                  <div className="w-1/4 text-slate-500 font-semibold text-xs uppercase">Esigenze / Note</div>
                  <div className="w-3/4 font-medium text-slate-800">{data.appointments?.[0]?.clientNeeds || "Nessuna specifica"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dettagli e Note */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <FileText className="w-3.5 h-3.5 mr-2" /> DETTAGLI E NOTE
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="mb-3">
                <div className="font-bold text-slate-700 mb-1 flex items-center text-xs"><FileText className="w-3.5 h-3.5 mr-1" /> NOTE TL</div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-800 text-xs italic">
                  {data.appointments?.[0]?.tlNotes || "Nessuna nota aggiuntiva dal Team Leader."}
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-700 mb-1 flex items-center text-xs"><Clock className="w-3.5 h-3.5 mr-1" /> STORICO ATTIVITÀ</div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-800 text-xs">
                  {data.appointments?.[0]?.outcomes?.map((out: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
                       <div className="flex items-center"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></div><span className="font-bold mr-1">{out.status}</span> <span>{out.notes}</span></div>
                     </div>
                  ))}
                  {(!data.appointments?.[0]?.outcomes || data.appointments[0].outcomes.length === 0) && "Nessun esito registrato."}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1"></div> {/* Spacer to push footer down */}

          {/* Prossimi Passi (Static as requested in design) */}
          <div className="mb-4 shrink-0">
            <div className="bg-slate-900 text-white inline-flex items-center px-4 py-1.5 rounded-tr-lg rounded-br-lg mb-2 font-bold text-xs tracking-widest">
              <CheckCircle className="w-3.5 h-3.5 mr-2" /> PROSSIMI PASSI CONSIGLIATI
            </div>
            <div className="grid grid-cols-3 gap-3 mt-1">
              <div className="flex items-start p-3 border border-slate-100 rounded-lg">
                <FileText className="w-6 h-6 text-slate-400 mr-2 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800">Preparare proposta</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Analizzare le esigenze espresse</div>
                </div>
              </div>
              <div className="flex items-start p-3 border border-slate-100 rounded-lg">
                <Phone className="w-6 h-6 text-slate-400 mr-2 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800">Follow-up telefonico</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Entro 2 giorni lavorativi</div>
                </div>
              </div>
              <div className="flex items-start p-3 border border-slate-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-slate-400 mr-2 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800">Inviare documenti</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Listino e presentazione servizi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-lg text-xs shrink-0">
            <div className="italic text-amber-500 font-serif text-sm px-2">"La cura del dettaglio fa la differenza"</div>
            <div className="text-slate-400 text-right text-[10px]">
              <div>Sistema di Gestione - {data.name}</div>
              <div>Documento generato automaticamente</div>
            </div>
          </div>

        </div>
      )}
"""

code = code.replace('    </div>\n  );\n}', new_print_layout + '    </div>\n  );\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
