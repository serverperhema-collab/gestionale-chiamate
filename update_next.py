import sys

path = 'src/app/api/contacts/next/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    // Note: Campaign filtering by sector is omitted until sectors are mapped to campaigns"""
replacement = """    // Campaign filtering based on isGestioneSeparata
    if (assignment.campaign === "PULIZIE") {
      whereCondition.isGestioneSeparata = true;
    } else if (assignment.campaign === "PERSONALE_HEMA") {
      whereCondition.isGestioneSeparata = false;
    }
    // "ENTRAMBI" leaves it unfiltered"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
