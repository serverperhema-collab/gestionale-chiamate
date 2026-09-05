import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\prisma\\schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the first definition with the merged one
old_enum = """enum NextActionType {
  RICHIAMO
  FISSA_NUOVO_APP
}"""
new_merged_enum = """enum NextActionType {
  NONE
  RICHIAMO
  FISSA_NUOVO_APP // Legacy
  APPUNTAMENTO
  ESITO_DA_INSERIRE
  PREVENTIVO
  APPROVAZIONE_TL
}"""

content = content.replace(old_enum, new_merged_enum)

# Remove the second definition
second_enum = """enum NextActionType {
  NONE
  RICHIAMO
  APPUNTAMENTO
  ESITO_DA_INSERIRE
  PREVENTIVO
  APPROVAZIONE_TL
}"""

content = content.replace(second_enum, "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")