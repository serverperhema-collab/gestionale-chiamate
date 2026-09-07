import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

function simplifyName(name: string): string {
  return name.toLowerCase()
    .replace(/\b(srl|spa|snc|sas|sapa|srls)\b/g, '') // Rimuovi suffissi legali
    .replace(/[^a-z0-9]/g, '') // Rimuovi spazi e punteggiatura
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "Il file CSV sembra vuoto o senza dati validi" }, { status: 400 });
    }

    const header = lines[0].toLowerCase();
    const isSemicolon = header.includes(';');
    const separator = isSemicolon ? ';' : ',';

    const headers = header.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nome'));
    const capIdx = headers.findIndex(h => h.includes('cap') || h.includes('zip'));
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('tel'));
    const sectorIdx = headers.findIndex(h => h.includes('sector') || h.includes('settore'));

    if (nameIdx === -1 || capIdx === -1 || phoneIdx === -1) {
      return NextResponse.json({ error: "Header non valido. Richiesti: nome, cap, telefono" }, { status: 400 });
    }

    const stats = { inserted: 0, skipped: 0, errors: [] as string[] };
    
    // Raggruppiamo i contatti in memoria per CAP per minimizzare query
    const contactsByCap: Record<string, any[]> = {};
    const parsedData = [];

    // Parse base e filtro vuoti
    for (let i = 1; i < lines.length; i++) {
      // Semplice regex per CSV fields che gestisce le virgolette (rudimentale, adatta per il caso standard)
      const line = lines[i];
      let fields = line.split(separator);
      
      const name = fields[nameIdx]?.trim().replace(/^"|"$/g, '');
      const cap = fields[capIdx]?.trim().padStart(5, '0').replace(/^"|"$/g, '');
      let phone = fields[phoneIdx]?.trim().replace(/^"|"$/g, '');
      const sector = sectorIdx !== -1 ? fields[sectorIdx]?.trim().replace(/^"|"$/g, '') : "Generico";

      if (!name || !cap || !phone) {
        stats.errors.push(`Riga ${i + 1}: Dati mancanti`);
        stats.skipped++;
        continue;
      }

      phone = phone.replace(/[^\d+]/g, '');

      parsedData.push({ name, cap, phone, sector, rowNum: i + 1 });
      if (!contactsByCap[cap]) contactsByCap[cap] = [];
    }

    // Carichiamo tutti i contatti esistenti per i CAP coinvolti
    const uniqueCaps = Object.keys(contactsByCap);
    const existingDbContacts = await prisma.contact.findMany({
      where: { cap: { in: uniqueCaps } },
      select: { id: true, name: true, cap: true, isKo: true, blacklisted: true, hiddenUntil: true, assignedToId: true }
    });

    const existingPhones = await prisma.contactPhone.findMany({
      select: { phone: true, contactId: true, contact: { select: { name: true, cap: true } } }
    });

    const existingPhonesSet = new Map();
    existingPhones.forEach(ep => {
      existingPhonesSet.set(ep.phone, ep.contact);
    });
    const existingOriginalPhones = await prisma.contact.findMany({
      where: { originalPhone: { not: null } },
      select: { originalPhone: true, name: true, cap: true }
    });
    existingOriginalPhones.forEach(ep => {
      if (ep.originalPhone) existingPhonesSet.set(ep.originalPhone, ep);
    });

    // Raggruppiamo il DB per CAP per controlli Levenshtein veloci
    existingDbContacts.forEach(c => {
      if (!contactsByCap[c.cap]) contactsByCap[c.cap] = [];
      contactsByCap[c.cap].push({ ...c, simplified: simplifyName(c.name) });
    });

    const toInsert = [];

    // Validazione riga per riga
    for (const data of parsedData) {
      const { name, cap, phone, sector, rowNum } = data;

      // 1. Check duplicate phone
      if (existingPhonesSet.has(phone)) {
        const dup = existingPhonesSet.get(phone);
        stats.errors.push(`Riga ${rowNum}: Telefono ${phone} già esistente (${dup.name})`);
        stats.skipped++;
        continue;
      }

      // 2. Check Levenshtein duplicate in CAP
      const simplifiedInput = simplifyName(name);
      const capContacts = contactsByCap[cap] || [];
      
      let isDuplicate = false;
      for (const existing of capContacts) {
        // Se simplified non c'è, calcolalo al volo (per quelli in cache da DB)
        const existingSimplified = existing.simplified || simplifyName(existing.name);
        
        // Match esatto semplificato
        if (simplifiedInput === existingSimplified) {
          isDuplicate = true;
          break;
        }

        // Se entrambi hanno almeno 5 caratteri usiamo Levenshtein
        if (simplifiedInput.length > 4 && existingSimplified.length > 4) {
          const maxDist = Math.max(simplifiedInput.length, existingSimplified.length) > 10 ? 3 : 2;
          const dist = levenshtein(simplifiedInput, existingSimplified);
          if (dist <= maxDist) {
            isDuplicate = true;
            break;
          }
        }
      }

      if (isDuplicate) {
        stats.errors.push(`Riga ${rowNum}: Duplicato fuzzy trovato per ${name} nel CAP ${cap}`);
        stats.skipped++;
        continue;
      }

      // Ok, passed all checks
      toInsert.push({
        name, cap, originalPhone: phone, sector, source: "MANUAL"
      });

      // Aggiungi in cache per non importare doppioni all'interno dello stesso CSV
      contactsByCap[cap].push({ name, cap, simplified: simplifiedInput });
      existingPhonesSet.set(phone, { name, cap });
    }

    if (toInsert.length > 0) {
      await prisma.contact.createMany({
        data: toInsert,
        skipDuplicates: true
      });
      stats.inserted = toInsert.length;
    }

    return NextResponse.json({ success: true, stats });

  } catch (error: any) {
    console.error("POST CSV import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
