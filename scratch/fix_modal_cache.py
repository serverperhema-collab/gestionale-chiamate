import re

with open('src/components/ContactEditModal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = r"useEffect\(\(\) => \{.*?\}, \[isOpen, contactId\]\);"

replacement = """useEffect(() => {
    if (isOpen) {
      if (contactId) {
        setLoading(true);
        fetch(`/api/tl/contacts/${contactId}?t=${Date.now()}`)
          .then(async res => {
             const data = await res.json();
             if (res.ok && data.contact) {
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
                toast.error(data.error || "Errore nel caricamento dati");
             }
          })
          .catch((err) => toast.error("Errore Rete: " + err.message))
          .finally(() => setLoading(false));
      } else {
        setFormData({
          name: "",
          originalPhone: "",
          cap: "",
          sector: "",
          address: "",
          email: "",
          referentName: "",
          notes: ""
        });
      }
    }
  }, [isOpen, contactId]);"""

new_c = re.sub(pattern, replacement, c, flags=re.DOTALL)

with open('src/components/ContactEditModal.tsx', 'w', encoding='utf-8') as f:
    f.write(new_c)

print('Done')
