import sys

path = 'src/app/api/tl/live-monitor/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """      let appt = 0; let enrichment = 0; let logins = 0; let minutesOn = 0;"""
replacement = """      let appt = 0; let enrichment = 0; let logins = 0; let minutesOn = 0; let gestioneSeparata = 0;"""
code = code.replace(target, replacement)

target2 = """      op.activityLogs.forEach(log => {
        if (log.action === "LOGIN") logins++;
        if (log.action === "CONTACT_ENRICHED" || log.action === "MODIFIED_EXISTING_DATA") enrichment++;
      });"""
replacement2 = """      op.activityLogs.forEach(log => {
        if (log.action === "LOGIN") logins++;
        if (log.action === "CONTACT_ENRICHED" || log.action === "MODIFIED_EXISTING_DATA") enrichment++;
        if (log.action === "GESTIONE_SEPARATA_REQUESTED") gestioneSeparata++;
      });"""
code = code.replace(target2, replacement2)

target3 = """        enrichment,
        minutesOn,
        logins
      };
    }));"""
replacement3 = """        enrichment,
        minutesOn,
        logins,
        gestioneSeparata
      };
    }));"""
code = code.replace(target3, replacement3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
