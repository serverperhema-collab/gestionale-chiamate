import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const operators = await prisma.user.findMany({
        where: { role: "OPERATORE", isActive: true },
        include: {
            activityLogs: { where: { createdAt: { gte: todayStart } } },
            callLogs: { where: { createdAt: { gte: todayStart } } }
        }
    });

    const results = [];

    for (const op of operators) {
        if (op.name.toLowerCase() === "prova") continue;

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

        if (diff !== 0) {
            await prisma.activityLog.create({
                data: {
                    userId: op.id,
                    action: "TIME_ADJUSTMENT",
                    details: diff.toString()
                }
            });
            results.push(`Operatore ${op.name}: aggiunto adjustment di ${diff}m (era ${currentTotal}m)`);
        } else {
            results.push(`Operatore ${op.name}: gia' a 60m`);
        }
    }

    return NextResponse.json({ success: true, results });
}
