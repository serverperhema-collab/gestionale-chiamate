import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const agendas = await prisma.zoneAgenda.findMany({
    where: {
      name: { startsWith: "Zona " }
    }
  });

  for (const agenda of agendas) {
    if (agenda.caps.length > 0) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${agenda.caps[0]}&country=Italy&format=json`, {
          headers: { 'User-Agent': 'CRM-App-Zonizzazione' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && data[0].display_name) {
            const parts = data[0].display_name.split(',').map((p: string) => p.trim());
            let zoneName = agenda.name;
            if (parts.length >= 3) {
              zoneName = `${parts[1]}, ${parts[2]}`;
            } else if (parts.length >= 2) {
              zoneName = parts[1];
            }
            
            await prisma.zoneAgenda.update({
              where: { id: agenda.id },
              data: { name: zoneName }
            });
            console.log(`Updated ${agenda.caps[0]} to ${zoneName}`);
          }
        }
      } catch (e) {
        console.error("Failed for", agenda.id, e);
      }
      
      // Delay to respect rate limits of nominatim
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
