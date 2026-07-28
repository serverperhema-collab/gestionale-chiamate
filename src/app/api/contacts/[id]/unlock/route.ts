import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });

    // Usiamo una ricerca molto più flessibile. 
    // L'indirizzo completo di Google ha troppi dettagli (es. "Metropolitan City of Rome..."), se lo mettiamo tra virgolette non troverà mai niente!
    // Prendiamo solo la prima parte dell'indirizzo (la via)
    const via = contact.address ? contact.address.split(',')[0] : '';
    const query = `"${contact.name}" ${via} ${contact.cap} telefono`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept-Language': 'it-IT,it;q=0.9',
            'Referer': 'https://html.duckduckgo.com/'
        }
    });
    
    const html = await res.text();
    const $ = cheerio.load(html);
    // Estrarre il testo dai risultati (gli snippet)
    const text = $('.result__snippet').text();

    // Regex per numeri di telefono italiani (es: 06 1234567, +39 333 1234567, 347-1234567)
    const regex = /(?:\+39|0039)?\s*([03]\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4})/g;
    const matches = text.match(regex);
    
    let bestPhone = "Nessun Risultato dal Web";
    if (matches && matches.length > 0) {
        // Pulizia e filtro
        const valid = matches.map(m => m.trim()).filter(m => {
            const digits = m.replace(/\D/g, '');
            // Un numero italiano vero ha tra le 8 (alcuni fissi vecchi) e le 12 cifre
            return digits.length >= 8 && digits.length <= 13;
        });
        
        if (valid.length > 0) {
            bestPhone = valid[0]; // Prendiamo il primo numero valido
        }
    }

    // Aggiorniamo il db
    const updated = await prisma.contact.update({
        where: { id },
        data: { originalPhone: bestPhone }
    });

    return NextResponse.json({ success: true, phone: bestPhone });

  } catch (error) {
    console.error("Errore Scraping:", error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
