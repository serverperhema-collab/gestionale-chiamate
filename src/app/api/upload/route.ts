import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Usa UUID per evitare collisioni di nomi
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    
    // Assicuriamoci che la cartella esista, Next.js root
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filepath = path.join(uploadDir, filename);

    // Creazione cartella upload se non esiste viene gestita omettendo la gestione avanzata per questo prototipo
    // Ma meglio provare a fare fs.mkdir
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filepath, buffer);

    // Ritorniamo l'URL pubblico
    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error) {
    console.error("POST upload error:", error);
    return NextResponse.json({ error: "Errore durante l'upload del file" }, { status: 500 });
  }
}
