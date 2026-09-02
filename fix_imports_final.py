import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add QuotesClient and AlertCircle
code = code.replace('import { Search, Filter, Phone, MapPin, RefreshCw, FileText, Calendar, CheckCircle } from "lucide-react";', 'import { Search, Filter, Phone, MapPin, RefreshCw, FileText, Calendar, CheckCircle, AlertCircle } from "lucide-react";\nimport QuotesClient from "../quotes/QuotesClient";')

# Expand State Type
code = code.replace('useState<"DA_SVOLGERE" | "SVOLTI" | "FUTURI">("SVOLTI");', 'useState<"DA_SVOLGERE" | "SVOLTI" | "FUTURI" | "QUOTES_REQUESTS" | "QUOTES_RECEIVED">("SVOLTI");')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
