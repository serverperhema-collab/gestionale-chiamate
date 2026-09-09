import re

with open('src/components/ContactEditModal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad = """                  if (data.contact) {
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
                  }"""

good = """                  if (data.contact) {
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
                  }"""

c = c.replace(bad, good)

# also change the catch to show the error text
c = c.replace('.catch(() => toast.error("Errore caricamento dati"))', '.catch((err) => toast.error("Errore Rete: " + err.message))')

with open('src/components/ContactEditModal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
