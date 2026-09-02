# -*- coding: utf-8 -*-
import sys

path = 'src/app/operator-terminal/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """  const handleTrashRequest = async () => {
    if (!trashNotes.trim()) {
      toast.error("Inserisci la motivazione");
      return;
    }
    handleOutcome("TRASH_REQUEST", trashNotes);
    setTrashModalOpen(false);
  };"""

replacement = """  const handleTrashRequest = async () => {
    if (!trashNotes.trim()) {
      toast.error("Inserisci la motivazione");
      return;
    }
    handleOutcome("TRASH_REQUEST", trashNotes);
    setTrashModalOpen(false);
  };

  const handleGestioneSeparataRequest = async () => {
    if (!gestioneSeparataNotes.trim()) {
      toast.error("Inserisci la motivazione");
      return;
    }
    if (!contact) return;
    try {
      const res = await fetch("/api/contacts/gestione-separata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, reason: gestioneSeparataNotes })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.autoApproved) {
            toast.success("Contatto inviato alle pulizie (Auto-approvato)");
        } else {
            toast.success("Richiesta Gestione Separata inviata alla TL");
        }
        setGestioneSeparataModalOpen(false);
        setGestioneSeparataNotes("");
        fetchNextContact();
      } else {
        toast.error(data.error || "Errore durante l'invio della richiesta");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };"""

if "handleGestioneSeparataRequest =" not in code:
    code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)