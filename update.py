import sys

path = 'src/app/api/contacts/[id]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """    // Check changes and identify if they are destructive (overwriting an existing non-empty value)
    if (originalPhone !== undefined) {
      updateData.originalPhone = originalPhone;
      if (contact.originalPhone && contact.originalPhone.trim() !== "" && contact.originalPhone !== originalPhone) isDestructive = true;
    }
    
    // Gestione N2 (primo numero nella relazione phones)
    const existingN2 = contact.phones?.[0];
    if (n2Phone !== undefined) {
      if (existingN2) {
        if (existingN2.phone !== n2Phone) {
          updateData.phones = {
            update: {
              where: { id: existingN2.id },
              data: { phone: n2Phone }
            }
          };
          if (existingN2.phone.trim() !== "") isDestructive = true;
        }
      } else if (n2Phone.trim() !== "") {
        updateData.phones = {
          create: {
            phone: n2Phone,
            label: "N2"
          }
        };
      }
    }

    if (email !== undefined) {
      updateData.email = email;
    }
    if (referentName !== undefined) {
      updateData.referentName = referentName;
    }
    if (website !== undefined) {
      updateData.website = website;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }"""

new_block = """    // Track changes for detailed logging
    const changedFields: string[] = [];

    // Check changes and identify if they are destructive (overwriting an existing non-empty value)
    if (originalPhone !== undefined && contact.originalPhone !== originalPhone) {
      updateData.originalPhone = originalPhone;
      const oldVal = contact.originalPhone || "(vuoto)";
      changedFields.push(`Telefono 1: da '${oldVal}' a '${originalPhone}'`);
      if (contact.originalPhone && contact.originalPhone.trim() !== "") isDestructive = true;
    }
    
    // Gestione N2 (primo numero nella relazione phones)
    const existingN2 = contact.phones?.[0];
    if (n2Phone !== undefined) {
      if (existingN2) {
        if (existingN2.phone !== n2Phone) {
          updateData.phones = {
            update: {
              where: { id: existingN2.id },
              data: { phone: n2Phone }
            }
          };
          const oldVal = existingN2.phone || "(vuoto)";
          changedFields.push(`Telefono 2: da '${oldVal}' a '${n2Phone}'`);
          if (existingN2.phone.trim() !== "") isDestructive = true;
        }
      } else if (n2Phone.trim() !== "") {
        updateData.phones = {
          create: {
            phone: n2Phone,
            label: "N2"
          }
        };
        changedFields.push(`Telefono 2: aggiunto '${n2Phone}'`);
      }
    }

    if (email !== undefined && contact.email !== email) {
      updateData.email = email;
      const oldVal = contact.email || "(vuoto)";
      changedFields.push(`Email: da '${oldVal}' a '${email}'`);
    }
    if (referentName !== undefined && contact.referentName !== referentName) {
      updateData.referentName = referentName;
      const oldVal = contact.referentName || "(vuoto)";
      changedFields.push(`Referente: da '${oldVal}' a '${referentName}'`);
    }
    if (website !== undefined && contact.website !== website) {
      updateData.website = website;
      const oldVal = contact.website || "(vuoto)";
      changedFields.push(`Sito Web: da '${oldVal}' a '${website}'`);
    }
    if (notes !== undefined && contact.notes !== notes) {
      updateData.notes = notes;
      changedFields.push(`Note: aggiornate`);
    }"""

code = code.replace(old_block, new_block)

old_log = """    transaction.push(prisma.activityLog.create({
      data: {
        userId,
        contactId: id,
        action: isDestructive ? "DATA_OVERWRITE" : "CONTACT_ENRICHED",
        details: isDestructive ? `Sostituzione dato esistente (contatore giornaliero: ${newModCount}` : "Aggiunta dati mancanti"
      }
    }));"""

new_log = """    const baseReason = isDestructive 
      ? `Sostituzione dato esistente (contatore giornaliero: ${newModCount})` 
      : "Aggiunta dati mancanti";
      
    const changeSummary = changedFields.length > 0 
      ? `\n\nDettagli Modifica:\n- ${changedFields.join('\\n- ')}`
      : "";

    transaction.push(prisma.activityLog.create({
      data: {
        userId,
        contactId: id,
        action: isDestructive ? "DATA_OVERWRITE" : "CONTACT_ENRICHED",
        details: baseReason + changeSummary
      }
    }));"""

code = code.replace(old_log, new_log)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
