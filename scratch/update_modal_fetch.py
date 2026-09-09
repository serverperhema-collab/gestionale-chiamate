import re

with open('src/components/ContactEditModal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad = """                fetch(`/api/tl/contacts/${contactId}`)
                  .then(res => res.json())
                  .then(data => {
                  if (data.contact) {
                    setFormData({
                      name: data.contact.name || "",
                      originalPhone: data.contact.originalPhone || "",
                      cap: data.contact.cap || "",
                      sector: data.contact.sector || "",
                      address: data.contact.address || "",
                      email: data.contact.email || "",
                      referentName: data.contact.referentName || "",
                      notes: data.contact.notes || ""
                    });
                  } else {
                    toast.error("Errore Dati: " + JSON.stringify(data));
                  }
          })
          .catch((err) => toast.error("Errore Rete: " + err.message))
          .finally(() => setLoading(false));"""

# The code in the file might be slightly different. I'll just use a robust replace using regex or string splits.
