import re
import os

# fix appointments route
path = "src/app/api/tl/appointments/[id]/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'if \(!trattativaAppt\) \{[\s\S]*?\} else \{', 'if (!trattativaAppt) { return NextResponse.json({error:"Not found"}, {status:404}); } else {', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# fix historical
path = "src/app/api/tl/appointments/historical/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'import \{[\s\S]*?\} from "@prisma/client";', 'import { AppointmentState } from "@prisma/client";', content)
    content = re.sub(r'if \(existing\) \{[\s\S]*?return NextResponse.json\(\{ success: true, updated: true \}\);\n\s*\}', '', content)
    content = re.sub(r'const neg = await prisma\.negotiation\.findFirst\(\{[\s\S]*?\}\);', '', content)
    content = re.sub(r'if \(neg\) \{[\s\S]*?\}', '', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# fix assign-recall
path = "src/app/api/tl/contacts/[id]/assign-recall/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'const neg = await prisma\.negotiation\.findFirst\(\{[\s\S]*?\}\);\n\s*if \(neg\) \{[\s\S]*?\}', '', content)
    content = re.sub(r'const app = await prisma\.appointment\.findFirst\(\{[\s\S]*?\}\);\n\s*if \(app\) \{[\s\S]*?\}', '', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# fix calendar assign
path = "src/app/api/tl/calendar/[id]/assign/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'const app = await prisma\.appointment\.findUnique\(\{[\s\S]*?\}\);', '', content)
    content = re.sub(r'if \(app\) \{[\s\S]*?return NextResponse\.json\(\{ success: true \}\);\n\s*\}', '', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# fix contacts logs
path = "src/app/api/tl/contacts/[id]/logs/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'negotiations: \{[\s\S]*?\},', '', content)
    content = re.sub(r'appointments: \{[\s\S]*?\},', '', content)
    content = re.sub(r'\.\.\.contact\.appointments\.map\(\(app: any\).*?\{[\s\S]*?\}\),?', '', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# fix contacts all
path = "src/app/api/tl/contacts/all/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'appointments: true,', '', content)
    content = re.sub(r'c\._count\.appointments > 0 \|\|', '', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# fix deletions appointments
path = "src/app/api/tl/deletions/appointments/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'const cancelledAppointments = \[\];', 'const cancelledAppointments: any[] = [];', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)

# fix fix-commerciale
path = "src/app/api/tl/fix-commerciale/route.ts"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: content = f.read()
    content = re.sub(r'await prisma\.appointmentOutcome\.deleteMany\(\{[\s\S]*?\}\);', '', content)
    with open(path, "w", encoding="utf-8") as f: f.write(content)