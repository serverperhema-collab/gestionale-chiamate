import sys

path = 'src/components/SearchContactModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add button
btn_marker = """                <button 
                  disabled={assigning || submittingReview}
                  onClick={() => { setShowWarning(false); setSelectedContact(null); setReviewNote(""); }}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Annulla
                </button>"""
hist_btn = """
                <button 
                  disabled={assigning || submittingReview}
                  onClick={() => setShowHistModal(true)}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  App. Storico
                </button>"""
code = code.replace(btn_marker, btn_marker + hist_btn)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
