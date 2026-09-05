import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\operator-dashboard\\negotiations\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_body = """        body: JSON.stringify({ action: "ABANDON" })"""
new_body = """        body: JSON.stringify({ action: "ABANDON", isNewSystem: negotiations.find(n => n.id === id)?.isNewSystem })"""
content = content.replace(legacy_body, new_body)

legacy_body2 = """        body: JSON.stringify({ targetUserId: selectedColleague, durationDays: parseInt(delegationDuration) })"""
new_body2 = """        body: JSON.stringify({ targetUserId: selectedColleague, durationDays: parseInt(delegationDuration), isNewSystem: negotiations.find(n => n.id === negotiationToDelegate)?.isNewSystem })"""
content = content.replace(legacy_body2, new_body2)

legacy_body3 = """        body: JSON.stringify({ action: "REVOKE" })"""
new_body3 = """        body: JSON.stringify({ action: "REVOKE", isNewSystem: negotiations.find(n => n.id === id)?.isNewSystem })"""
content = content.replace(legacy_body3, new_body3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)