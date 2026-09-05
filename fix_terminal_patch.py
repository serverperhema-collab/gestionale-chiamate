import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\operator-terminal\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_patch = """                        const res = await fetch("/api/operator/recalls/pending", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: recall.id, minutes: 15 })
                        });"""

new_patch = """                        const res = await fetch("/api/operator/recalls/pending", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: recall.id, minutes: 15, isNewSystem: recall.isNewSystem })
                        });"""

content = content.replace(legacy_patch, new_patch)

legacy_patch_60 = """                        const res = await fetch("/api/operator/recalls/pending", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: recall.id, minutes: 60 })
                        });"""

new_patch_60 = """                        const res = await fetch("/api/operator/recalls/pending", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: recall.id, minutes: 60, isNewSystem: recall.isNewSystem })
                        });"""
                        
content = content.replace(legacy_patch_60, new_patch_60)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)