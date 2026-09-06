import os
import glob
import re

for file in glob.glob("src/app/api/**/*.ts", recursive=True):
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    modified = False
    if 'appointments: true,' in content:
        content = content.replace('appointments: true,', '')
        modified = True
    if 'negotiations: true,' in content:
        content = content.replace('negotiations: true,', '')
        modified = True
    if 'c._count.appointments' in content:
        content = re.sub(r'c\._count\.appointments > 0 \|\|', '', content)
        modified = True
    if 'reviewRequestedAt' in content:
        content = re.sub(r'reviewRequestedAt: null,?', '', content)
        content = re.sub(r'reviewRequestedAt: true,?', '', content)
        content = re.sub(r'c\.reviewRequestedAt', 'null', content)
        content = re.sub(r'reviewRequestedAt:\s*\{[^\}]+\},?', '', content)
        modified = True
    if 'reviewNote' in content:
        content = re.sub(r'reviewNote: null,?', '', content)
        content = re.sub(r'c\.reviewNote', '""', content)
        modified = True
    if 'appointments: {' in content:
        content = re.sub(r'appointments:\s*\{[\s\S]*?\},', '', content)
        modified = True
    if 'negotiations: {' in content:
        content = re.sub(r'negotiations:\s*\{[\s\S]*?\},', '', content)
        modified = True
    
    if modified:
        with open(file, "w", encoding="utf-8") as f:
            f.write(content)
