import { QueryPlannerService } from '@/lib/extraction/QueryPlannerService';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, DefaultSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

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

        // 1. Create ScrapingJob
        const job = await prisma.scrapingJob.create({
            data: {
                cap,
                maxEstimatedCost: 5.0, // Default for now
                maxQueries: 200, // Default for now
                currentCost: 0,
                queriesExecuted: 0,
                status: 'RUNNING'
            }
        });

        // 2. Upsert QueryFamily for each sector
        for (const sector of sectors) {
            const familyId = `${cap}_${sector}`;
            await prisma.queryFamily.upsert({
                where: { id: familyId },
                create: {
                    id: familyId,
                    concept: sector,
                    scope: cap
                },
                update: {} }); await QueryPlannerService.selectNextAction(job.id, familyId); }

        return NextResponse.json({ success: true, data: { jobId: job.id } });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

