import { QueryPlannerService } from '@/lib/extraction/QueryPlannerService';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, DefaultSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const maxDuration = 60; // Diamo tempo alla lambda su Vercel

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as { role?: string } & DefaultSession['user'];
        if (!session || (user?.role !== 'TEAM_LEADER' && user?.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { cap, source, sectors } = body;

        if (!cap || !sectors || !Array.isArray(sectors) || sectors.length === 0) {
            return NextResponse.json({ success: false, error: "Missing cap or sectors" }, { status: 400 });
        }

        const job = await prisma.scrapingJob.create({
            data: {
                cap,
                maxEstimatedCost: 5.0,
                maxQueries: 200, 
                currentCost: 0,
                queriesExecuted: 0,
                status: 'RUNNING'
            }
        });

        // Parallelizzazione a blocchi (chunk) per evitare strozzature sul DB e velocizzare
        const chunkSize = 5;
        for (let i = 0; i < sectors.length; i += chunkSize) {
            const chunk = sectors.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (sector) => {
                const familyId = `${cap}_${sector}`;
                await prisma.queryFamily.upsert({
                    where: { id: familyId },
                    create: { id: familyId, concept: sector, scope: cap },
                    update: {} 
                });
                await QueryPlannerService.selectNextAction(job.id, familyId);
            }));
        }

        return NextResponse.json({ success: true, data: { jobId: job.id } });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
