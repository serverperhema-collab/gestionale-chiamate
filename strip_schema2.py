import re

path = "prisma/schema.prisma"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r"\s*asCommerciale\s+Appointment\[\]\s*@relation\([^\)]+\)", "", content)
content = re.sub(r"\s*asOperator\s+Appointment\[\]\s*@relation\([^\)]+\)", "", content)
content = re.sub(r"\s*quoteRequests\s+QuoteRequest\[\]", "", content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)