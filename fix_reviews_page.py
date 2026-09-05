import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\settings\\reviews\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """      const res = await fetch("/api/tl/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, newDate, rejectReason })
      });"""

good = """      const isNewSystem = reviews.find(r => r.id === id)?.isNewSystem;
      const res = await fetch("/api/tl/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, newDate, rejectReason, isNewSystem })
      });"""

content = content.replace(bad, good)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)