import sys

path = 'src/app/tl-dashboard/settings/reviews/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''                        <input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded" />
                        <input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded" />'''
repl1 = '''                        <input type="date" value={rescheduleData.date} onChange={e => setRescheduleData(prev => prev ? {...prev, date: e.target.value} : null)} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded" />
                        <input type="time" value={rescheduleData.time} onChange={e => setRescheduleData(prev => prev ? {...prev, time: e.target.value} : null)} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded" />'''
code = code.replace(target1, repl1)

target2 = '''                        <button onClick={() => {
                          if (!rescheduleData.date || !rescheduleData.time) return toast.error("Inserisci data e ora");
                          const d = new Date(rescheduleData.date);
                          const [h,m] = rescheduleData.time.split(":");
                          d.setHours(+h,+m);
                          handleDerogaAction(rev.id, "DEROGA_RESCHEDULE", d.toISOString());
                        }}'''
repl2 = '''                        <button onClick={() => {
                          if (!rescheduleData?.date || !rescheduleData?.time) return toast.error("Inserisci data e ora");
                          const d = new Date(rescheduleData.date);
                          const [h,m] = rescheduleData.time.split(":");
                          d.setHours(+h,+m);
                          handleDerogaAction(rev.id, "DEROGA_RESCHEDULE", d.toISOString());
                        }}'''
code = code.replace(target2, repl2)

target3 = '''                      <textarea
                        value={rejectReasonData.reason}
                        onChange={e => setRejectReasonData({...rejectReasonData, reason: e.target.value})}'''
repl3 = '''                      <textarea
                        value={rejectReasonData.reason}
                        onChange={e => setRejectReasonData(prev => prev ? {...prev, reason: e.target.value} : null)}'''
code = code.replace(target3, repl3)

target4 = '''                        <button onClick={() => {
                          if (!rejectReasonData.reason.trim()) return toast.error("Inserisci la motivazione");
                          handleDerogaAction(rev.id, "DEROGA_REJECT", undefined, rejectReasonData.reason);
                        }}'''
repl4 = '''                        <button onClick={() => {
                          if (!rejectReasonData?.reason.trim()) return toast.error("Inserisci la motivazione");
                          handleDerogaAction(rev.id, "DEROGA_REJECT", undefined, rejectReasonData.reason);
                        }}'''
code = code.replace(target4, repl4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")