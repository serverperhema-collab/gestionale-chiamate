import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // In un ambiente di produzione vero, controlleremmo un API_SECRET
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log("Iniziando il Reset di Mezzanotte...");

    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const transaction = [];

    // 1. Azzerare i contatori "Non Risponde" per tutti i contatti
    transaction.push(
      prisma.contact.updateMany({
        where: { noAnswerCount: { gt: 0 } },
        data: { noAnswerCount: 0 }
      })
    );

    // 2. Togliere i blocchi temporanei (Non Risponde, Non Reperibile) 
    // che hanno una scadenza a breve termine (meno di 24h nel futuro)
    // Le trattative hanno 1 anno di hidden, quindi non verranno toccate
    transaction.push(
      prisma.contact.updateMany({
        where: { 
          hiddenUntil: { not: null, lt: tomorrow }
        },
        data: { hiddenUntil: null }
      })
    );

    // 3. Resettare i contatori di skip per gli operatori
    transaction.push(
      prisma.user.updateMany({
        where: { skipCount: { gt: 0 } },
        data: { skipCount: 0 }
      })
    );

    // Eseguiamo
    await prisma.$transaction(transaction);

    console.log("Reset di Mezzanotte completato con successo.");

    return NextResponse.json({ success: true, message: "Reset notturno eseguito correttamente." });
  } catch (error) {
    console.error("Cron reset error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
