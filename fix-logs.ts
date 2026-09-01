import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const operators = await prisma.user.findMany({
        where: { role: "OPERATORE", isActive: true },
        include: {
            activityLogs: {
                where: { createdAt: { gte: todayStart } }
            },
            callLogs: {
                where: { createdAt: { gte: todayStart } }
            }
        }
    });

    console.log(`Trovati ${operators.length} operatori.`);

    for (const op of operators) {
        if (op.name.toLowerCase() === "prova") {
            console.log(`Salto operatore 'prova' (${op.id})`);
            continue;
        }

        // Calcoliamo quanti minuti ha attualmente
        let firstLogMs: number | null = null;
        let timeAdjustment = 0;

        op.callLogs.forEach(log => {
            const t = new Date(log.createdAt).getTime();
            if (!firstLogMs || t < firstLogMs) firstLogMs = t;
        });
        op.activityLogs.forEach(log => {
            const t = new Date(log.createdAt).getTime();
            if (!firstLogMs || t < firstLogMs) firstLogMs = t;
            if (log.action === "TIME_ADJUSTMENT") {
                timeAdjustment += parseInt(log.details || "0") || 0;
            }
        });

        let minutesOn = 0;
        let lastMs = op.lastActivityAt ? new Date(op.lastActivityAt).getTime() : new Date().getTime();

        if (op.activityLogs.length > 0) {
            op.activityLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const mostRecentLog = op.activityLogs[0];
            if (["FORCE_LOGOUT", "AUTO_LOGOUT", "LOGOUT"].includes(mostRecentLog.action)) {
                lastMs = new Date(mostRecentLog.createdAt).getTime();
            }
        }

        if (firstLogMs) {
            minutesOn = Math.max(0, Math.floor((lastMs - firstLogMs) / 60000));
        }

        const currentTotal = Math.max(0, minutesOn + timeAdjustment);
        const diff = 60 - currentTotal;

        console.log(`Operatore ${op.name}: currentTotal = ${currentTotal}m. Aggiungo adjustment di ${diff}m per arrivare a 60.`);

        // Inseriamo l'aggiustamento per arrivare esattamente a 60 (1 ora)
        if (diff !== 0) {
            await prisma.activityLog.create({
                data: {
                    userId: op.id,
                    action: "TIME_ADJUSTMENT",
                    details: diff.toString()
                }
            });
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
