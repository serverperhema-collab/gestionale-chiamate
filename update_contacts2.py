# -*- coding: utf-8 -*-
import sys

path = 'src/app/tl-dashboard/settings/contacts/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    const getStatusBadge = (c: any) => {
      if (c.isKo) return <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-semibold">KO</span>;"""

replacement = """    const removeGestioneSeparata = async (id: string) => {
      if (!confirm("Sei sicuro di voler rimuovere questo contatto dalla Gestione Separata (Pulizie)? Tornera nel calderone principale.")) return;
      try {
        const res = await fetch(`/api/contacts/${id}/gestione-separata`, { method: "PATCH" });
        if (res.ok) {
          toast.success("Contatto ripristinato nel calderone principale");
          fetchData(page);
        } else {
          toast.error("Errore");
        }
      } catch (e) {
        toast.error("Errore di rete");
      }
    };

    const getStatusBadge = (c: any) => {
      if (c.isGestioneSeparata) return <button onClick={() => removeGestioneSeparata(c.id)} className="px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded text-xs font-semibold hover:bg-emerald-800 transition">Pulizie (Clicca per rimuovere)</button>;
      if (c.isKo) return <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-semibold">KO</span>;"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)