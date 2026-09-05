import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\quotes\\QuotesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_patch = """      const res = await fetch(`/api/tl/quotes/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           status: newStatus,
           tlNotes,
           quoteUrl
        })
      });"""

new_patch = """      let res;
      if (selectedReq.isNewSystem) {
        res = await fetch(`/api/trattative/${selectedReq.id}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             action: "upload-quote",
             payload: {
               url: quoteUrl || "",
               notes: tlNotes
             }
          })
        });
      } else {
        res = await fetch(`/api/tl/quotes/${selectedReq.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             status: newStatus,
             tlNotes,
             quoteUrl
          })
        });
      }"""

content = content.replace(legacy_patch, new_patch)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)