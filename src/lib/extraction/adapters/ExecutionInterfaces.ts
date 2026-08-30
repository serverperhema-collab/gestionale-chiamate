import { ExtractionSource } from "@prisma/client";

export interface RawDiscoveryContact {
    source: ExtractionSource;
    sourceId: string;
    rawName: string;
    rawAddress: string | null;
    lat?: number;
    lng?: number;
}

export interface ExecutionEngineResult {
    success: boolean;
    rawContacts: RawDiscoveryContact[];
    executionCost: number;
    resultLimit?: number;
    error?: string;
}
