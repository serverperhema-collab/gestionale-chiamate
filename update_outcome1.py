# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = """    if (outcome === "SKIP" && user.role === "OPERATORE" && user.skipLockedUntil && user.skipLockedUntil > new Date()) {"""
replacement1 = """    if (!user.isTrusted && outcome === "SKIP" && user.role === "OPERATORE" && user.skipLockedUntil && user.skipLockedUntil > new Date()) {"""
code = code.replace(target1, replacement1)

target2 = """    if (user.role === "OPERATORE" && user.noAnswerLockedUntil && user.noAnswerLockedUntil > new Date()) {"""
replacement2 = """    if (!user.isTrusted && user.role === "OPERATORE" && user.noAnswerLockedUntil && user.noAnswerLockedUntil > new Date()) {"""
code = code.replace(target2, replacement2)

target3 = """    if (user.role === "OPERATORE" && user.notAvailableLockedUntil && user.notAvailableLockedUntil > new Date()) {"""
replacement3 = """    if (!user.isTrusted && user.role === "OPERATORE" && user.notAvailableLockedUntil && user.notAvailableLockedUntil > new Date()) {"""
code = code.replace(target3, replacement3)

target_lock_skip = """      if (recentSkips + 1 >= user.maxSkip && user.role === "OPERATORE") {"""
replacement_lock_skip = """      if (!user.isTrusted && recentSkips + 1 >= user.maxSkip && user.role === "OPERATORE") {"""
code = code.replace(target_lock_skip, replacement_lock_skip)

target_lock_noanswer = """        if (recentNoAnswers + 1 >= user.maxNoAnswer && user.role === "OPERATORE") {"""
replacement_lock_noanswer = """        if (!user.isTrusted && recentNoAnswers + 1 >= user.maxNoAnswer && user.role === "OPERATORE") {"""
code = code.replace(target_lock_noanswer, replacement_lock_noanswer)

target_lock_notavailable = """        if (recentNotAvailable + 1 >= user.maxNotAvailable && user.role === "OPERATORE") {"""
replacement_lock_notavailable = """        if (!user.isTrusted && recentNotAvailable + 1 >= user.maxNotAvailable && user.role === "OPERATORE") {"""
code = code.replace(target_lock_notavailable, replacement_lock_notavailable)

target_trash = """      } else if (outcome === "TRASH_REQUEST") {
        contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni (per sempre finchè TL non sblocca)
        contactUpdateData.reviewRequestedAt = new Date();
        contactUpdateData.reviewNote = `RICHIESTA ELIMINAZIONE: ${notes || "Nessuna motivazione"}`;"""

replacement_trash = """      } else if (outcome === "TRASH_REQUEST") {
        if (user.isTrusted) {
          contactUpdateData.isKo = true;
          contactUpdateData.blacklisted = true;
          contactUpdateData.blacklistReason = notes || "Cestinato da operatore fidato";
          contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni
          
          transaction.push(prisma.activityLog.create({
            data: {
              userId,
              contactId: id,
              action: "CONTACT_DELETED",
              details: `[AUTO-APPROVATO FIDATO] Cestinato: ${notes || "Nessuna motivazione"}`
            }
          }));
        } else {
          contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni (per sempre finchè TL non sblocca)
          contactUpdateData.reviewRequestedAt = new Date();
          contactUpdateData.reviewNote = `RICHIESTA ELIMINAZIONE: ${notes || "Nessuna motivazione"}`;
          
          eventEmitter.emit("tl-alert", { 
            type: "REVIEW", 
            operatorName: userName, 
            reason: `Richiesta eliminazione contatto da valutare.` 
          });

          transaction.push(prisma.deletionRequest.create({
            data: {
              contactId: id,
              operatorId: userId,
              reason: notes || "Nessuna motivazione"
            }
          }));

          transaction.push(prisma.activityLog.create({
            data: {
              userId,
              contactId: id,
              action: "CONTACT_REVIEW_REQUESTED",
              details: `Richiesta Eliminazione/KO: ${notes || "Nessuna motivazione"}`
            }
          }));
        }
"""

# I need to find the part where the else pushes deletionRequest and delete it from the original target, or just use regex.
# Since my target_trash was just the first few lines, if I replace it, it will create invalid TS. Let's do it carefully.