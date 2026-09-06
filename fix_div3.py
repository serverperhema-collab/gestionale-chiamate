import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\hidden-contacts\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """          />
        </div>
      </div>

      {filteredContacts.length === 0 ? ("""

good = """          />
        </div>
        </div>
      </div>

      {filteredContacts.length === 0 ? ("""

content = content.replace(bad, good)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)