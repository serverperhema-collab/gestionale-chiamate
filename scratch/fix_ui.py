import re

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad_part = """            <input
              type="text"
              placeholder="Filtra per Settore..."
        {loading ? ("""

good_part = """            <input
              type="text"
              placeholder="Filtra per Settore..."
              value={sector}
              onChange={(e) => {setSector(e.target.value); setPage(1);}}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 transition appearance-none"
          >
            <option value="">Tutti gli stati</option>
            <option value="FREE">Liberi e Lavorabili</option>
            <option value="ASSIGNED">Assegnati</option>
            <option value="HIDDEN">Nascosti (Trattative)</option>
            <option value="KO">KO Definitivi</option>
            <option value="CESTINO">Cestino (Blacklist)</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto bg-gray-900 p-6">
        {loading ? ("""

c = c.replace(bad_part, good_part)

c = c.replace(
    'if (c.isKo) return <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-semibold">KO</span>;',
    'if (c.blacklisted) return <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-semibold">Cestino</span>;\\n    if (c.isKo) return <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-semibold">KO</span>;'
)

with open('src/app/tl-dashboard/settings/contacts/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed frontend')
