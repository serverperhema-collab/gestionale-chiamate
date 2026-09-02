import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Import QuotesClient
code = code.replace('import { Phone, Calendar, User, Clock, FileText, CheckCircle, Search, RefreshCw, XCircle } from "lucide-react";', 'import { Phone, Calendar, User, Clock, FileText, CheckCircle, Search, RefreshCw, XCircle, AlertCircle } from "lucide-react";\nimport QuotesClient from "../quotes/QuotesClient";')

# Expand Tab Type
code = code.replace('type TabType = "DA_SVOLGERE" | "SVOLTI" | "FUTURI";', 'type TabType = "DA_SVOLGERE" | "SVOLTI" | "FUTURI" | "QUOTES_REQUESTS" | "QUOTES_RECEIVED";')

# Add Sidebar buttons
old_sidebar = """          <button 
            onClick={() => setActiveTab("FUTURI")}
            className={`w-full text-left px-4 py-4 rounded-xl border transition flex flex-col ${activeTab === "FUTURI" ? 'bg-teal-600/20 border-teal-500 text-teal-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
          >
            <span className="font-bold text-lg mb-1">In Agenda</span>
            <span className="text-xs opacity-80">Futuri / Oggi ({futuri.length})</span>
          </button>"""

new_sidebar = old_sidebar + """
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block px-2">Preventivi</span>
            <button 
              onClick={() => setActiveTab("QUOTES_REQUESTS")}
              className={`w-full flex items-center px-4 py-3 rounded-xl border transition ${activeTab === "QUOTES_REQUESTS" ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="font-bold">Richieste in Attesa</span>
            </button>
            <button 
              onClick={() => setActiveTab("QUOTES_RECEIVED")}
              className={`w-full flex items-center px-4 py-3 mt-2 rounded-xl border transition ${activeTab === "QUOTES_RECEIVED" ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
            >
              <FileText className="w-5 h-5 mr-3" />
              <span className="font-bold">Inviati dal Comm.</span>
            </button>
          </div>"""
          
code = code.replace(old_sidebar, new_sidebar)

# Change title
code = code.replace('<h1 className="text-2xl font-bold text-white mb-2">Appuntamenti</h1>', '<h1 className="text-2xl font-bold text-white mb-2">Appuntamenti & Preventivi</h1>')

# Conditionally render main content OR QuotesClient
main_content = """        {/* Main Content */}
        <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
          
          {/* Filters */}"""
          
new_main_content = """        {/* Main Content */}
        <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
          {(activeTab === "QUOTES_REQUESTS" || activeTab === "QUOTES_RECEIVED") ? (
            <QuotesClient externalTab={activeTab === "QUOTES_REQUESTS" ? "REQUESTS" : "RECEIVED"} />
          ) : (
            <>
          {/* Filters */}"""
          
code = code.replace(main_content, new_main_content)

# We need to close the Fragment before the end of the div
code = code.replace('             </div>\n          )}\n        </div>\n\n      </div>\n    </div>\n    </div>\n  );\n}', '             </div>\n          )}\n        </div>\n            </>\n          )}\n      </div>\n    </div>\n    </div>\n  );\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
