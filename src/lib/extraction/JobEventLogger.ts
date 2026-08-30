import { prisma } from '../prisma';
import { Prisma, PrismaClient } from '@prisma/client';

export type JobEventType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PLANNER' | 'EXECUTION' | 'QUEUE';

export class JobEventLogger {
    static async log(jobId: string, type: JobEventType, message: string, metadata?: any, tx?: Prisma.TransactionClient) {
        try {
            const client = tx || prisma;
            await client.scrapingJobEvent.create({
                data: {
                    jobId,
                    type,
                    message,
                    metadata: metadata ? JSON.stringify(metadata) : undefined
                }
            });
        } catch (e) {
            console.error("Impossibile salvare l'evento del Job:", e);
        }
    }
}
