import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\callbacks\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_func = """  const handleFreeContact = async (contactId: string) => {
    try {
      // Per liberare il contatto basta un piccolo endpoint o usiamo un metodo PATCH
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: null, isPersonalCallback: false })
      });"""

new_func = """  const handleFreeContact = async (contact: any) => {
    try {
      let res;
      if (contact.isNewSystem) {
         res = await fetch(`/api/trattative/${contact.trattativaId}/actions`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ action: "chiudi-persa", payload: { note: "Rilasciato dal TL" } })
         });
      } else {
        res = await fetch(`/api/contacts/${contact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId: null, isPersonalCallback: false })
        });
      }"""

content = content.replace(legacy_func, new_func)

content = content.replace("onClick={() => handleFreeContact(contact.id)}", "onClick={() => handleFreeContact(contact)}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)