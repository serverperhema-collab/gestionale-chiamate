# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/appointments/[id]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    const {
      companyName,
      address,
      city,
      province,
      cap,
      referentName,
      referentRole,
      phone,
      email,
      clientNeeds,
      date,
      zoneAgendaId,
      operatorId,
      isPhoneAppt
    } = body;"""

replacement = """    const {
      companyName,
      address,
      city,
      province,
      cap,
      referentName,
      referentRole,
      phone,
      email,
      clientNeeds,
      date,
      zoneAgendaId,
      operatorId,
      isPhoneAppt,
      status,
      contactAction,
      blockDays
    } = body;"""

code = code.replace(target, replacement)

target2 = """      // 1. Update Contact
      await tx.contact.update({
        where: { id: appointment.contactId },
        data: {
          name: companyName !== undefined ? companyName : appointment.contact.name,
          address: address !== undefined ? address : appointment.contact.address,
          cap: cap !== undefined ? cap : appointment.contact.cap,
        }
      });"""

replacement2 = """      // 1. Update Contact
      const contactUpdateData: any = {
        name: companyName !== undefined ? companyName : appointment.contact.name,
        address: address !== undefined ? address : appointment.contact.address,
        cap: cap !== undefined ? cap : appointment.contact.cap,
      };

      if (status === "CANCELLED" && contactAction) {
        contactUpdateData.assignedToId = null;
        if (contactAction === "RESTORE") {
          contactUpdateData.hiddenUntil = null;
        } else if (contactAction === "BLOCK" && blockDays) {
          contactUpdateData.hiddenUntil = new Date(Date.now() + blockDays * 24 * 60 * 60 * 1000);
        }
      }

      await tx.contact.update({
        where: { id: appointment.contactId },
        data: contactUpdateData
      });"""

code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)