# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/reviews/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''    } else if (action === "BLACKLIST") {
      // Elimina definitivamente e sposta nel cestino permanente (blacklist)
      await prisma.$transaction(['''

replacement = '''    } else if (action === "DEROGA_ACCEPT") {
      await prisma.appointment.update({
        where: { id },
        data: { isApproved: true, status: "CONFIRMED" }
      });
      return NextResponse.json({ success: true });
    } else if (action === "DEROGA_REJECT") {
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (appt) {
        await prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: { id },
            data: { status: "CANCELLED" }
          });
          // Se commercialeId esiste (significa che è un Commerciale che si stava auto-fissando), lo rimandiamo in FOLLOW_UP
          if (appt.commercialeId) {
            await tx.contact.update({
              where: { id: appt.contactId },
              data: {
                assignedToId: appt.commercialeId,
                commercialStatus: "FOLLOW_UP",
                hiddenUntil: null
              }
            });
          }
        });
      }
      return NextResponse.json({ success: true });
    } else if (action === "DEROGA_RESCHEDULE") {
      const { newDate } = await req.json().catch(() => ({ newDate: null })); // The body is already consumed? Wait, we need to extract from req.json if possible, but req.json() can only be called once.
      // We will fix req.json() parsing at the top of the function instead.
    } else if (action === "BLACKLIST") {
      // Elimina definitivamente e sposta nel cestino permanente (blacklist)
      await prisma.$transaction(['''

# Need to fix the `await req.json()` usage to extract `newDate` as well
target_json = '''    const { id, action } = await req.json(); // action can be "RESTORE" or "BLACKLIST"
    if (!id || !action) {'''
replacement_json = '''    const body = await req.json();
    const { id, action, newDate } = body;
    if (!id || !action) {'''
code = code.replace(target_json, replacement_json)

target_reschedule = '''    } else if (action === "DEROGA_RESCHEDULE") {
      const { newDate } = await req.json().catch(() => ({ newDate: null })); // The body is already consumed? Wait, we need to extract from req.json if possible, but req.json() can only be called once.
      // We will fix req.json() parsing at the top of the function instead.
    } else if (action === "BLACKLIST") {'''
replacement_reschedule = '''    } else if (action === "DEROGA_RESCHEDULE") {
      if (!newDate) return NextResponse.json({ error: "newDate missing" }, { status: 400 });
      await prisma.appointment.update({
        where: { id },
        data: { 
          isApproved: true, 
          status: "CONFIRMED",
          date: new Date(newDate)
        }
      });
      return NextResponse.json({ success: true });
    } else if (action === "BLACKLIST") {'''

code = code.replace(target, replacement)
code = code.replace(target_reschedule, replacement_reschedule)

# In the PATCH handler, `id` might be an appointment id (for deroga) or contact id (for review/blacklist).
# So we shouldn't `findUnique` on contact if it's a deroga action because it will fail.
target_contact_check = '''    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }'''
replacement_contact_check = '''    let contact = null;
    if (!action.startsWith("DEROGA_")) {
      contact = await prisma.contact.findUnique({ where: { id } });
      if (!contact) {
        return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
      }
    }'''
code = code.replace(target_contact_check, replacement_contact_check)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")