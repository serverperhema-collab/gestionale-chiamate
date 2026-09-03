import sys

path = 'src/app/tl-dashboard/appointments/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = 'import { Calendar, ChevronLeft, ChevronRight, Search, Phone, FileText, User, RefreshCw, Filter, Briefcase, Plus, MapPin, Clock, X } from "lucide-react";'
repl = 'import { Calendar, ChevronLeft, ChevronRight, Search, Phone, FileText, User, RefreshCw, Filter, Briefcase, Plus, MapPin, Clock, X, Crown } from "lucide-react";'
code = code.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")