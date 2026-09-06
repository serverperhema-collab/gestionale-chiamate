import re
path = "src/app/tl-dashboard/settings/hidden-contacts/page.tsx"
with open(path, "r", encoding="utf-8") as f: content = f.read()

filters_jsx = """
        {/* Filters Grid */}
        <div className="bg-gray-800/20 border border-gray-800/80 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center text-gray-400 mr-2">
            <Filter className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Filtra per:</span>
          </div>
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <MultiSelect 
              placeholder="Operatore" 
              options={uniqueOperators} 
              selected={filterOperators} 
              onChange={setFilterOperators} 
            />
            <MultiSelect 
              placeholder="Motivazione Blocco" 
              options={uniqueReasons} 
              selected={filterReasons} 
              onChange={setFilterReasons} 
            />
            <MultiSelect 
              placeholder="CAP" 
              options={uniqueCaps} 
              selected={filterCaps} 
              onChange={setFilterCaps} 
            />
          </div>
          {(filterOperators.length > 0 || filterReasons.length > 0 || filterCaps.length > 0) && (
            <button 
              onClick={() => { setFilterOperators([]); setFilterReasons([]); setFilterCaps([]); }}
              className="text-gray-400 hover:text-white px-3 py-2 text-sm flex items-center transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </button>
          )}
        </div>
"""

content = re.sub(r'        </div>\n\n      \w*\{\s*loading \? \(', filters_jsx + '\n      {loading ? (', content)

with open(path, "w", encoding="utf-8") as f: f.write(content)