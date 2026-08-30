import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobEventLogger } from '@/lib/extraction/JobEventLogger';

export async function POST(req: Request, { params }: { params: { jobId: string } }) {
    try {
        await prisma.scrapingJob.update({
            where: { id: params.jobId },
            data: { status: 'RUNNING' }
        });
        await JobEventLogger.log(params.jobId, 'INFO', 'Job ripreso manualmente.');
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
