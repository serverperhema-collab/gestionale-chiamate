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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { cap, keyword } = await req.json();

    if (!cap || !keyword) {
      return NextResponse.json({ error: "CAP e keyword sono obbligatori" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key di Google Maps mancante nel file .env" }, { status: 500 });
    }

    const query = encodeURIComponent(`${keyword} cap ${cap} italia`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ error: `Errore API Google: ${data.status}` }, { status: 500 });
    }

    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json({ results: { found: 0, saved: 0, duplicates: 0 } });
    }

    const places = data.results;
    
    // Fetch existing contacts in this CAP to avoid DB lookups in a loop
    const existingContacts = await prisma.contact.findMany({
      where: { cap }
    });
    
    const existingSimplifiedNames = new Set(existingContacts.map(c => simplifyName(c.name)));
    const existingPlaceIds = new Set(existingContacts.map(c => c.placeId));

    let saved = 0;
    let duplicates = 0;

    for (const place of places) {
      // Basic validation
      if (!place.name || !place.place_id) continue;
      
      const simplifiedName = simplifyName(place.name);

      if (existingPlaceIds.has(place.place_id) || existingSimplifiedNames.has(simplifiedName)) {
        duplicates++;
        continue;
      }

      // Fetch place details to get phone and website
      let phone = null;
      let website = null;
      
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        
        if (detailsData.status === "OK") {
          phone = detailsData.result.formatted_phone_number || null;
          website = detailsData.result.website || null;
        }
      } catch(e) {
        // Ignora l'errore dei dettagli e salva comunque il contatto
      }

      // Save to database
      await prisma.contact.create({
        data: {
          placeId: place.place_id,
          name: place.name,
          cap: cap, // Force the CAP requested
          sector: keyword,
          address: place.formatted_address || null,
          website: website,
          originalPhone: phone,
          businessStatus: place.business_status || "OPERATIONAL",
          phones: phone ? {
            create: { phone, label: "Principale (Google)" }
          } : undefined
        }
      });
      
      // Update our sets so we don't save duplicates within the same API response
      existingPlaceIds.add(place.place_id);
      existingSimplifiedNames.add(simplifiedName);
      saved++;
    }

    return NextResponse.json({ 
      results: { 
        found: places.length, 
        saved, 
        duplicates 
      } 
    });

  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
