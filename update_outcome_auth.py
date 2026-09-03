# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/commerciale/appointments/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Auth Check
target_auth = """    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "COMMERCIALE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const commercialeId = (session.user as any).id;"""

replacement_auth = """    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || (user.role !== "COMMERCIALE" && user.role !== "TEAM_LEADER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = user.id;
    const isTL = user.role === "TEAM_LEADER";"""
code = code.replace(target_auth, replacement_auth)

# 2. Update Commerciale check
target_check = """    if (appointment.commercialeId !== commercialeId) {
      return NextResponse.json({ error: "Non sei autorizzato a modificare questo appuntamento" }, { status: 403 });
    }"""
replacement_check = """    if (!isTL && appointment.commercialeId !== userId) {
      return NextResponse.json({ error: "Non sei autorizzato a modificare questo appuntamento" }, { status: 403 });
    }
    const targetCommercialeId = appointment.commercialeId || userId;"""
code = code.replace(target_check, replacement_check)

# 3. QuoteRequest creation
target_quote = """          update: {
            commercialeId,
            notes: quoteNotes
          },
          create: {
            appointmentId: id,
            commercialeId,
            notes: quoteNotes
          }"""
replacement_quote = """          update: {
            commercialeId: targetCommercialeId,
            notes: quoteNotes
          },
          create: {
            appointmentId: id,
            commercialeId: targetCommercialeId,
            notes: quoteNotes
          }"""
code = code.replace(target_quote, replacement_quote)

# 4. Appointment create commercialeId
target_appt_create = """            operatorId: appointment.operatorId,
            commercialeId: commercialeId,
            date: new Date(nextActionDate),"""
replacement_appt_create = """            operatorId: appointment.operatorId,
            commercialeId: targetCommercialeId,
            date: new Date(nextActionDate),"""
code = code.replace(target_appt_create, replacement_appt_create)

# 5. Activity Log
target_log = """      // Log
      await tx.activityLog.create({
        data: {
          userId: commercialeId,
          contactId: appointment.contactId,
          action: "COMMERCIALE_OUTCOME_SAVED",
          details: `Esito registrato. Nuovo stato: ${nextStatus}`
        }
      });"""
replacement_log = """      // Log
      await tx.activityLog.create({
        data: {
          userId: userId,
          contactId: appointment.contactId,
          action: isTL ? "TL_MODIFIED_OUTCOME" : "COMMERCIALE_OUTCOME_SAVED",
          details: isTL ? `Il TL ha registrato/modificato l'esito. Nuovo stato: ${nextStatus}` : `Esito registrato dal commerciale. Nuovo stato: ${nextStatus}`
        }
      });"""
code = code.replace(target_log, replacement_log)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)