import os
import glob
import re

for file in glob.glob("src/app/api/**/*.ts", recursive=True):
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    modified = False
    
    # Simple fix for dangling commas and braces
    if '},' in content or '} }' in content:
        # Actually it's easier to just recreate them from template or fix manually.
        pass
