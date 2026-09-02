import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Import QuotesClient if not imported
if 'QuotesClient' not in code[:200]:
    code = code.replace('import { Phone, Calendar, User, Clock, FileText, CheckCircle, Search, RefreshCw, XCircle } from "lucide-react";', 'import { Phone, Calendar, User, Clock, FileText, CheckCircle, Search, RefreshCw, XCircle, AlertCircle } from "lucide-react";\nimport QuotesClient from "../quotes/QuotesClient";')

# Expand Tab Type
code = code.replace('type TabType = "DA_SVOLGERE" | "SVOLTI" | "FUTURI";', 'type TabType = "DA_SVOLGERE" | "SVOLTI" | "FUTURI" | "QUOTES_REQUESTS" | "QUOTES_RECEIVED";')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
