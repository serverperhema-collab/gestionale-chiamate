import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\hidden-contacts\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

good = """        <div className="flex gap-4 w-full xl:w-auto">
          <a
            href="/api/tl/backup/hidden-contacts"
            className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white rounded-lg transition text-sm font-medium whitespace-nowrap shadow"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Scarica Backup
          </a>
          <div className="relative w-full xl:w-72">"""

content = re.sub(r'<div className="relative w-full xl:w-72">', good, content, count=1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)