# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/contacts/gestione-separata/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    // Ensure it doesn't already exist"""
replacement = """    if (user.isTrusted) {
      await prisma.contact.update({
        where: { id: contactId },
        data: {
          isGestioneSeparata: true,
          assignedToId: null,
          hiddenUntil: null
        }
      });

      await prisma.activityLog.create({
        data: {
          userId,
          contactId,
          action: "GESTIONE_SEPARATA_APPROVED",
          details: `[AUTO-APPROVATO FIDATO] Motivo: ${reason}`
        }
      });

      return NextResponse.json({ success: true, autoApproved: true });
    }

    // Ensure it doesn't already exist"""
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)