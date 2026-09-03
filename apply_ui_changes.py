# -*- coding: utf-8 -*-
import sys
import re

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State for files
code = code.replace('const [file, setFile] = useState<File | null>(null);', 'const [files, setFiles] = useState<File[]>([]);')

# 2. handleFileChange
target_handler = '''  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };'''
replacement_handler = '''  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };'''
if target_handler in code:
    code = code.replace(target_handler, replacement_handler)

# 3. uploadFile (single -> multiple)
target_upload = '''  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        return data.url;
      } else {
        toast.error("Errore upload file");
        return null;
      }
    } catch (e) {
      toast.error("Errore di rete durante upload");
      return null;
    } finally {
      setUploading(false);
    }
  };'''
replacement_upload = '''  const uploadFiles = async (): Promise<string | null> => {
    if (files.length === 0) return null;
    
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const f of files) {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          urls.push(data.url);
        } else {
          toast.error("Errore upload file " + f.name);
        }
      }
      return urls.join(",");
    } catch (e) {
      toast.error("Errore di rete durante upload");
      return null;
    } finally {
      setUploading(false);
    }
  };'''
if target_upload in code:
    code = code.replace(target_upload, replacement_upload)

# 4. handleSubmit logic (fix all !file occurrences)
code = code.replace("!file", "files.length === 0")

target_submit1 = '''        } else if (quoteOption === "ATTACH") {
          if (files.length === 0) {
            toast.error("Allega il file del preventivo.");
            return;
          }
        }'''
replacement_submit1 = '''        } else if (quoteOption === "ATTACH" && outcomeFinal !== "VENDUTO") {
          if (files.length === 0) {
            toast.error("Allega il file del preventivo.");
            return;
          }
        } else if (outcomeFinal === "VENDUTO") {
          if (files.length === 0) {
            toast.error("Allega il contratto e i documenti richiesti.");
            return;
          }
        }'''
if target_submit1 in code:
    code = code.replace(target_submit1, replacement_submit1)

target_submit2 = '''      if (quoteOption === "ATTACH" && file) {
        const quoteUrl = await uploadFile();
        if (!quoteUrl) {
          setSubmitting(false);
          return; // Upload failed
        }
        payload.quoteUrl = quoteUrl;
        payload.quoteAttached = true;
      }'''
replacement_submit2 = '''      if ((quoteOption === "ATTACH" || outcomeFinal === "VENDUTO") && files.length > 0) {
        const quoteUrl = await uploadFiles();
        if (!quoteUrl) {
          setSubmitting(false);
          return; // Upload failed
        }
        payload.quoteUrl = quoteUrl;
        payload.quoteAttached = true;
      }'''
if target_submit2 in code:
    code = code.replace(target_submit2, replacement_submit2)

# Also check if user reverted to single file, we might need to replace `file` directly
code = code.replace('quoteOption === "ATTACH" && file', '(quoteOption === "ATTACH" || outcomeFinal === "VENDUTO") && files.length > 0')

# 5. UI Rendering
target_ui = r'                  \{\/\* PREVENTIVO \*\/\}'
replacement_ui = '''                  {/* VENDUTO: CONTRATTO FIRMATO */}
                  {outcomeFinal === "VENDUTO" && (
                    <div className="bg-emerald-900/20 border border-emerald-500/50 rounded-xl p-4 animate-in fade-in zoom-in-95 duration-300">
                      <h4 className="text-emerald-400 font-bold text-lg mb-2 flex items-center">
                        <Handshake className="w-5 h-5 mr-2" />
                        COMPLIMENTI!
                      </h4>
                      <p className="text-sm text-gray-300 mb-4">
                        Ottimo lavoro! Allega qui il contratto firmato e gli eventuali documenti necessari. Puoi caricare più file.
                      </p>
                      <input 
                        type="file" 
                        accept=".pdf,image/*"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-900/30 file:text-emerald-400 hover:file:bg-emerald-900/50 transition-all cursor-pointer"
                      />
                      {files.length > 0 && (
                        <div className="mt-2 text-xs text-emerald-400">
                          {files.length} {files.length === 1 ? 'file selezionato' : 'file selezionati'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PREVENTIVO */}'''
code = re.sub(target_ui, replacement_ui, code)

# Conditionally render Preventivo and Azione Successiva
target_preventivo_azione = r'(                  \{\/\* PREVENTIVO \*\/\}\s*<div className="bg-gray-800/50 p-4 rounded-xl space-y-4">.*?)(\s*\{\/\* NOTE \*\/\})'
replacement_preventivo_azione = r'''                  {outcomeFinal !== "VENDUTO" && (
                    <>
\1                    </>
                  )}
\2'''
code = re.sub(target_preventivo_azione, replacement_preventivo_azione, code, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("DONE")