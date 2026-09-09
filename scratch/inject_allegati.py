import re

with open('src/components/TrattativaTimeline.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Make sure lucide-react has Paperclip and Download
if 'Paperclip' not in c:
    c = c.replace('import { History', 'import { Paperclip, Download, History')

# Inject the "Allegati" section just above the Timeline events (which is usually a <div className="space-y-4"> mapped from events)
bad = """{/* Timeline */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-gray-900/50">"""

good = """{/* Timeline e Allegati */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-gray-900/50">

            {trattativa.attachments && trattativa.attachments.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-gray-800/80 border border-gray-700">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2 text-blue-400" /> Allegati ({trattativa.attachments.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trattativa.attachments.map((att: any) => (
                    <div key={att.id} className="flex flex-col p-3 rounded-lg bg-gray-900 border border-gray-700 hover:border-blue-500/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-xs font-bold text-gray-400 mb-1">{att.type}</span>
                          <span className="text-sm text-gray-200 truncate" title={att.filename}>{att.filename}</span>
                        </div>
                        <a 
                          href={att.url} 
                          download={att.filename}
                          className="p-2 rounded bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                          title="Scarica File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}"""

c = c.replace(bad, good)

with open('src/components/TrattativaTimeline.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
