import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\hidden-contacts\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

good = """        <div className="relative w-full xl:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-lg leading-5 bg-gray-900 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out shadow-inner"
            placeholder="Cerca nome contatto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <EyeOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Nessun contatto nascosto</h2>
          <p className="text-gray-400">Attualmente non ci sono contatti in pausa o bloccati.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors shadow-lg flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                      <User className="w-5 h-5 mr-2 text-emerald-400" />
                      {contact.name}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {contact.province} • {contact.cap}
                    </p>
                  </div>
                  <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20 shadow-sm whitespace-nowrap">
                    Bloccato
                  </span>
                </div>

                <div className="space-y-3 bg-gray-800/40 rounded-lg p-3 border border-gray-800/80">
                  <div className="flex items-start">
                    <Clock className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5 font-bold">Scadenza Blocco</p>
                      <p className="text-sm text-white font-medium">
                        {contact.hiddenUntil ? new Date(contact.hiddenUntil).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5 font-bold">Motivo del Blocco</p>
                      <p className="text-sm text-gray-300">{contact.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 p-3 flex justify-between items-center">"""

import re
content = re.sub(r'<div className="relative w-full xl:w-72">[\s\S]*?<div className="bg-gray-800/30 p-3 flex justify-between items-center">', good, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)