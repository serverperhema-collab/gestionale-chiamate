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
code = code.replace(target_upload, replacement_upload)

# 4. handleSubmit logic
target_submit1 = '''        } else if (quoteOption === "ATTACH") {
          if (!file) {
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
code = code.replace(target_submit2, replacement_submit2)

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

# Fix input field inside Preventivo section to be multiple if they want, but let's keep it simple and just change `onChange` to `files` logic
target_input_preventivo = '''                    {quoteOption === "ATTACH" && (
                      <input 
                        type="file" 
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        required
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/30 file:text-purple-400"
                      />
                    )}'''
replacement_input_preventivo = '''                    {quoteOption === "ATTACH" && (
                      <div className="space-y-2">
                        <input 
                          type="file" 
                          accept=".pdf,image/*"
                          multiple
                          onChange={handleFileChange}
                          required
                          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/30 file:text-purple-400"
                        />
                        {files.length > 0 && (
                          <div className="text-xs text-purple-400">
                            {files.length} file selezionat{files.length === 1 ? 'o' : 'i'}
                          </div>
                        )}
                      </div>
                    )}'''
code = code.replace(target_input_preventivo, replacement_input_preventivo)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("DONE")