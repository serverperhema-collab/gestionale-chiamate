import re

with open('src/components/WizardCreaTrattativa.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('import { X, Calendar, Clock, Handshake, FileText, Upload, User, Briefcase, ThumbsDown } from "lucide-react";', 'import { X, Calendar, Clock, Handshake, FileText, Upload, User, Briefcase, ThumbsDown, Save } from "lucide-react";')

with open('src/components/WizardCreaTrattativa.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Done")
