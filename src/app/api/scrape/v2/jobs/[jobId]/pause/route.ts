import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobEventLogger } from '@/lib/extraction/JobEventLogger';

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    try {
        await prisma.scrapingJob.update({
            where: { id: (await params).jobId },
            data: { status: 'PAUSED' }
        });
        await JobEventLogger.log((await params).jobId, 'WARNING', 'Job messo in pausa manualmente.');
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}


