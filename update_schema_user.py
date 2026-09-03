# -*- coding: utf-8 -*-
import sys
import re

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'model User \{[\s\S]*?\}'
match = re.search(target, code)
if match:
    user_block = match.group(0)
    if "notifications Notification[]" not in user_block:
        # Add it before the closing brace
        user_block_new = user_block.replace('}', '  notifications Notification[]\n}')
        code = code.replace(user_block, user_block_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")