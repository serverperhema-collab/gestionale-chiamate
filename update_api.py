# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/live-monitor/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add maxSkip and maxSkipMins to select
target_select = """        name: true,
        lastActivityAt: true,
        maxIdleTimeMins: true,
        skipCount: true,"""
replacement_select = """        name: true,
        lastActivityAt: true,
        maxIdleTimeMins: true,
        maxSkip: true,
        maxSkipMins: true,"""
code = code.replace(target_select, replacement_select)

# 2. Calculate recentSkips dynamically
target_map = """      op.activityLogs.forEach(log => {
        if (log.action === "LOGIN") logins++;
        if (log.action === "CONTACT_ENRICHED" || log.action === "MODIFIED_EXISTING_DATA") enrichment++;
        if (log.action === "GESTIONE_SEPARATA_REQUESTED") gestioneSeparata++;
      });

      return {"""
replacement_map = """      op.activityLogs.forEach(log => {
        if (log.action === "LOGIN") logins++;
        if (log.action === "CONTACT_ENRICHED" || log.action === "MODIFIED_EXISTING_DATA") enrichment++;
        if (log.action === "GESTIONE_SEPARATA_REQUESTED") gestioneSeparata++;
      });

      // Calcolo reale degli Skip nel time window
      const timeWindowStartSkip = new Date(nowMs - (op.maxSkipMins || 60) * 60 * 1000);
      let recentSkips = 0;
      for (const log of op.activityLogs) {
        if (log.action === "OUTCOME_SKIP" && new Date(log.createdAt).getTime() >= timeWindowStartSkip.getTime()) {
          recentSkips++;
        }
      }

      return {"""
code = code.replace(target_map, replacement_map)

# 3. Export recentSkips and maxSkip instead of skipCount
target_return = """        isIdle,
        isDisconnected,
        skipCount: op.skipCount,
        currentContact: op.assignedContacts[0] || null,"""
replacement_return = """        isIdle,
        isDisconnected,
        recentSkips,
        maxSkip: op.maxSkip || 5,
        currentContact: op.assignedContacts[0] || null,"""
code = code.replace(target_return, replacement_return)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)