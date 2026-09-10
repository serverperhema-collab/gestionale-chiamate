import re

with open('src/app/tl-dashboard/appointments/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace button 1
btn1 = '''<button 
              onClick={() => {
                setCreateModalAgendaPrefill(null);
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Inserisci App. Senza Agenda
            </button>'''
content = content.replace(btn1, "")

# Replace button 2
btn2 = '''<button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreateModalAgendaPrefill(agenda);
                                setCreateModalOpen(true);
                              }}
                              className="p-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded transition"
                              title="Nuovo Appuntamento in questa Agenda"
                            >
                              <Plus className="w-5 h-5" />
                            </button>'''
content = content.replace(btn2, "")

# Replace the modal component
modal = '''{createModalOpen && (
        <CreateAppointmentModalTL 
          agendaPrefill={createModalAgendaPrefill}
          onClose={() => { setCreateModalOpen(false); setCreateModalAgendaPrefill(null); }}
          onSuccess={() => {
            setCreateModalOpen(false);
            setCreateModalAgendaPrefill(null);
            fetchAppointments();
          }}
        />
      )}'''
content = content.replace(modal, "")

with open('src/app/tl-dashboard/appointments/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
