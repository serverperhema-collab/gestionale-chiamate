import sys

path = 'src/app/tl-dashboard/settings/reviews/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('value={rescheduleData.date}', 'value={rescheduleData?.date || ""}')
code = code.replace('value={rescheduleData.time}', 'value={rescheduleData?.time || ""}')
code = code.replace('value={rejectReasonData.reason}', 'value={rejectReasonData?.reason || ""}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")