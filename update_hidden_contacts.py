import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\hidden-contacts\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """        <div className="relative w-full xl:w-72">"""
good = """        <div className="flex gap-4 w-full xl:w-auto">
          <a
            href="/api/tl/backup/hidden-contacts"
            className="flex items-center justify-center px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-lg transition text-sm font-medium whitespace-nowrap shadow"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Nascosti / KO
          </a>
          <div className="relative w-full xl:w-72">"""
content = content.replace(bad, good)
content = content.replace("</div>\n      </div>\n\n      {filteredContacts.length", "</div>\n        </div>\n      </div>\n\n      {filteredContacts.length")
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)