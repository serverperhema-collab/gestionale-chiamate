'use client';
import QuadtreeVisualizer from '@/components/QuadtreeVisualizer';

import React, { useEffect, useState } from 'react';

// === Tipi di Dati ===
type JobData = {
    id: string; status: string; cap: string; createdAt: string; maxEstimatedCost: number; currentCost: number; maxQueries: number;
    _count?: { queries: number }; googleContacts: number; osmContacts: number; totalNewContacts: number; totalDuplicates: number;
    pendingQueries: number; yieldUltime5: number; newContactsUltime5: number;
};
type PlannerAction = {
    queryText: string; strategy: string; geoCellId?: string; geoDepth?: number; estimatedYield: number; confidence: number;
    gapMultiplier: number; explorationMult: number; estimatedCost: number; priority: number; plannerReason: string;
};
type JobEvent = { id: string; timestamp: string; type: string; message: string; };
type ScrapingQuery = {
    id: string; createdAt: string; strategy: string; queryText: string; geoCellId?: string; geoDepth?: number;
    status: string; resultCount?: number; newResultCount?: number; actualYield?: number; executionCost?: number;
    priority?: number; plannerReason?: string;
};
type StrategyStat = {
    strategy: string; totalQueries: number; totalResults: number; totalNewResults: number; totalDuplicates: number;
    avgActualYield: number; avgNewResultsPerQuery: number; confidence: number; executionCost: number;
};
type CalibrationData = {
    avgEstimatedYield: number; avgActualYield: number; avgNewResults: number; avgConfidence: number; estimatedVsActualError: number;
};

import { useParams } from 'next/navigation';
function formatNum(value: number | null | undefined, decimals = 2, mult = 1): string {
    if (value === null || value === undefined) return '-';
    return (value * mult).toFixed(decimals);
}

export default function DashboardClient() {
    const params = useParams();
    const jobId = params.jobId as string;
    const [job, setJob] = useState<JobData | null>(null);
    const [plannerNext, setPlannerNext] = useState<PlannerAction | null>(null);
    const [events, setEvents] = useState<JobEvent[]>([]);
    
    // Queue State
    const [queries, setQueries] = useState<ScrapingQuery[]>([]);
    const [queriesTotal, setQueriesTotal] = useState(0);
    const [qPage, setQPage] = useState(1);
    const [qSortBy, setQSortBy] = useState('createdAt');
    const [qSortDir, setQSortDir] = useState('desc');
    const [qFilterStrategy, setQFilterStrategy] = useState('');
    const [qFilterStatus, setQFilterStatus] = useState('');
    const [expandedQId, setExpandedQId] = useState<string | null>(null);

    // Stats State
    const [strategyStats, setStrategyStats] = useState<StrategyStat[]>([]);
    const [calibration, setCalibration] = useState<CalibrationData | null>(null);

    const fetchDashboardData = async () => {
        try {
            const [resJob, resPlanner, resEvents, resStats, resQueries] = await Promise.all([
                fetch(`/api/scrape/v2/jobs/${jobId}`),
                fetch(`/api/scrape/v2/jobs/${jobId}/planner`),
                fetch(`/api/scrape/v2/jobs/${jobId}/events`),
                fetch(`/api/scrape/v2/jobs/${jobId}/stats`),
                fetch(`/api/scrape/v2/jobs/${jobId}/queries?page=${qPage}&pageSize=15&sortBy=${qSortBy}&sortDir=${qSortDir}&strategy=${qFilterStrategy}&status=${qFilterStatus}`)
            ]);

            if (resJob.ok) setJob((await resJob.json()).data);
            if (resPlanner.ok) setPlannerNext((await resPlanner.json()).data);
            if (resEvents.ok) setEvents((await resEvents.json()).data);
            
            if (resStats.ok) {
                const sData = await resStats.json();
                setStrategyStats(sData.data.strategyStats || []);
                setCalibration(sData.data.jobCalibration || null);
            }

            if (resQueries.ok) {
                const qData = await resQueries.json();
                setQueries(qData.data.queries || []);
                setQueriesTotal(qData.data.totalCount || 0);
            }
        } catch (error) {
            console.error("Errore fetch dashboard data:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => {
            if (job && (job.status === 'RUNNING' || job.status === 'PENDING')) {
                fetchDashboardData();
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [job?.status, qPage, qSortBy, qSortDir, qFilterStrategy, qFilterStatus]);

    // Orchestratore Client-Side temporaneo per il collaudo E2E
    useEffect(() => {
        if (!job || job.status !== 'RUNNING') return;
        let active = true;
        const processQueue = async () => {
            if (!active) return;
            try {
                const res = await fetch('/api/scrape/v2/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId })
                });
                const data = await res.json();
                if (data.status !== 'IDLE') {
                    setTimeout(processQueue, 500); // Loop veloce se ha trovato query
                } else {
                    setTimeout(processQueue, 3000);
                }
            } catch (e) {
                setTimeout(processQueue, 3000);
            }
        };
        processQueue();
        return () => { active = false; };
    }, [job?.status, jobId]);

    if (!job) return <div className="text-gray-400 p-8">Caricamento console motore...</div>;

    const tempoTrascorso = (() => {
        const diff = Date.now() - new Date(job.createdAt).getTime();
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${m}m ${s}s`;
    })();
    
    const isRunning = job.status === 'RUNNING';
    const isPaused = job.status === 'PAUSED';
    const handleAction = async (action: 'pause' | 'resume' | 'stop') => {
        await fetch(`/api/scrape/v2/jobs/${jobId}/${action}`, { method: 'POST' });
        fetchDashboardData();
    };

    // Costruzione della View
    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* HEADER & KPI (Omitted to keep it short, re-use existing logic structurally) */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Estrazione {job.cap}</h1>
                    <div className="flex gap-4 text-sm">
                        <span className={`px-2 py-1 rounded font-bold ${isRunning ? 'bg-green-900 text-green-300' : isPaused ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700 text-gray-300'}`}>{job.status}</span>
                        <span className="text-gray-400">Avvio: {new Date(job.createdAt).toLocaleTimeString()}</span>
                        <span className="text-gray-400">Tempo: {tempoTrascorso}</span>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    {isRunning && <button onClick={() => handleAction('pause')} className="bg-yellow-600 text-white px-4 py-2 rounded">Pausa</button>}
                    {isPaused && <button onClick={() => handleAction('resume')} className="bg-green-600 text-white px-4 py-2 rounded">Riprendi</button>}
                    <button onClick={() => handleAction('stop')} className="bg-red-600 text-white px-4 py-2 rounded">Arresta</button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm">Nuove Attività</div>
                    <div className="text-2xl font-bold text-green-400">{job.totalNewContacts}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm">Costo</div>
                    <div className="text-2xl font-bold text-white">${formatNum(job.currentCost, 3)}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm">Query Completate</div>
                    <div className="text-2xl font-bold text-white">{job._count?.queries || 0} / {job.maxQueries}</div>
                </div>
                {calibration && (
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 col-span-2">
                        <div className="text-gray-400 text-sm mb-1">Calibrazione Planner</div>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-xs text-gray-500">Exp. Yield vs Actual</div>
                                <div className="text-lg font-bold text-blue-300">{formatNum(calibration?.avgEstimatedYield, 1, 100)}% vs {formatNum(calibration?.avgActualYield, 1, 100)}%</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Stato Apprendimento</div>
                                <div className={`text-sm font-bold ${calibration.estimatedVsActualError < 0.1 ? 'text-green-400' : calibration.estimatedVsActualError < 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {calibration.estimatedVsActualError < 0.1 ? 'PREVISIONI ACCURATE' : calibration.estimatedVsActualError < 0.3 ? 'IN CALIBRAZIONE' : 'POCO ACCURATE'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* STRATEGY STATS TABLE */}
            {strategyStats.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 overflow-x-auto">
                    <h2 className="text-xl font-bold text-white mb-4">Statistiche Strategie</h2>
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-400 bg-gray-900">
                            <tr>
                                <th className="p-3 rounded-tl-lg">Strategy</th>
                                <th className="p-3 text-right">Queries</th>
                                <th className="p-3 text-right">Risultati</th>
                                <th className="p-3 text-right">Nuove</th>
                                <th className="p-3 text-right">Duplicati</th>
                                <th className="p-3 text-right">Avg Yield</th>
                                <th className="p-3 text-right">Avg New/Q</th>
                                <th className="p-3 text-right">Confidence</th>
                                <th className="p-3 text-right rounded-tr-lg">Costo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {strategyStats.map(s => (
                                <tr key={`${s.strategy}`} className="hover:bg-gray-750">
                                    <td className="p-3 font-bold text-gray-200">{s.strategy}</td>
                                    <td className="p-3 text-right text-gray-300">{s.totalQueries}</td>
                                    <td className="p-3 text-right text-gray-300">{s.totalResults}</td>
                                    <td className="p-3 text-right text-green-400">{s.totalNewResults}</td>
                                    <td className="p-3 text-right text-yellow-500">{s.totalDuplicates}</td>
                                    <td className="p-3 text-right font-mono text-gray-300">{formatNum(s.avgActualYield, 1, 100)}%</td>
                                    <td className="p-3 text-right font-mono text-gray-300">{formatNum(s.avgNewResultsPerQuery, 1)}</td>
                                    <td className="p-3 text-right font-mono text-gray-300">{formatNum(s.confidence, 2)}</td>
                                    <td className="p-3 text-right text-red-300">`${formatNum(s.executionCost, 3)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* QUERY QUEUE TABLE */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Query Queue</h2>
                    <div className="flex gap-2">
                        <select className="bg-gray-900 border border-gray-700 text-white p-2 rounded text-sm" value={qFilterStrategy} onChange={e => setQFilterStrategy(e.target.value)}>
                            <option value="">Tutte le Strategie</option>
                            <option value="BASE">BASE</option>
                            <option value="SYNONYM">SYNONYM</option>
                            <option value="GEO_CELL">GEO_CELL</option>
                        </select>
                        <select className="bg-gray-900 border border-gray-700 text-white p-2 rounded text-sm" value={qFilterStatus} onChange={e => setQFilterStatus(e.target.value)}>
                            <option value="">Tutti gli Stati</option>
                            <option value="PENDING">PENDING</option>
                            <option value="RUNNING">RUNNING</option>
                            <option value="PAGE_LIMIT_REACHED">PAGE_LIMIT_REACHED</option>
                            <option value="LOW_YIELD">LOW_YIELD</option>
                            
                            <option value="FAILED">FAILED</option>
                        </select>
                        <select className="bg-gray-900 border border-gray-700 text-white p-2 rounded text-sm" value={qSortBy} onChange={e => setQSortBy(e.target.value)}>
                            <option value="createdAt">Più recenti</option>
                            <option value="priority">Priorità</option>
                            <option value="actualYield">Yield</option>
                            <option value="newResultCount">Nuovi Ris.</option>
                            <option value="executionCost">Costo</option>
                        </select>
                        <button onClick={() => setQSortDir(d => d==='asc'?'desc':'asc')} className="bg-gray-700 px-3 rounded text-white text-sm">
                            {qSortDir === 'desc' ? '↓' : '↑'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-400 bg-gray-900">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Concept / Strategy</th>
                                <th className="p-3">Stato</th>
                                <th className="p-3 text-right">Priority</th>
                                <th className="p-3 text-right">New / Tot</th>
                                <th className="p-3 text-right">Yield</th>
                                <th className="p-3 text-right">Cost</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {queries.map(q => {
                                const isExpanded = expandedQId === q.id;
                                const statusColors:any = {
                                    PENDING: 'text-gray-400',
                                    RUNNING: 'text-yellow-400 font-bold',
                                    PAGE_LIMIT_REACHED: 'text-orange-400 font-bold',
                                    LOW_YIELD: 'text-yellow-600',
                                    BRANCH_CLOSED: 'text-gray-500',
                                    
                                    FAILED: 'text-red-500 font-bold'
                                };
                                return (
                                    <React.Fragment key={q.id}>
                                        <tr className="hover:bg-gray-750 cursor-pointer" onClick={() => setExpandedQId(isExpanded ? null : q.id)}>
                                            <td className="p-3 text-gray-500 font-mono text-xs">{new Date(q.createdAt).toLocaleTimeString()}</td>
                                            <td className="p-3">
                                                <div className="font-bold text-gray-200">{q.queryText}</div>
                                                <div className="text-xs text-gray-500 flex gap-2">
                                                    <span>{q.strategy}</span>
                                                    {q.geoDepth !== null && <span>Depth: {q.geoDepth}</span>}
                                                </div>
                                            </td>
                                            <td className={`p-3 ${statusColors[q.status] || 'text-gray-400'}`}>{q.status}</td>
                                            <td className="p-3 text-right font-mono text-purple-400">{formatNum(q.priority, 2)}</td>
                                            <td className="p-3 text-right font-mono text-gray-300">
                                                <span className="text-green-400">{q.newResultCount ?? '-'}</span> / {q.resultCount ?? '-'}
                                            </td>
                                            <td className="p-3 text-right font-mono text-gray-300">{formatNum(q.actualYield, 1, 100) + (q.actualYield != null ? "%" : "")}</td>
                                            <td className="p-3 text-right text-gray-400">{q.executionCost ? "$" + formatNum(q.executionCost, 3) : "-"}</td>
                                            <td className="p-3 text-center text-gray-500">{isExpanded ? '▲' : '▼'}</td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-gray-900 border-b border-gray-700">
                                                <td colSpan={8} className="p-4 text-xs text-gray-400 space-y-2">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="font-bold text-gray-300 mb-1">Dettagli Geo</div>
                                                            <div>Cell ID: {q.geoCellId || 'N/A'}</div>
                                                            <div>Depth: {q.geoDepth ?? 'N/A'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-300 mb-1">Logica Planner</div>
                                                            <div className="font-mono text-purple-300">{q.plannerReason || 'Nessuna motivazione registrata'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {/* PAGINATION */}
                    <div className="flex justify-between items-center p-4 bg-gray-900 border-t border-gray-700 text-sm">
                        <div className="text-gray-400">Totale: {queriesTotal} query</div>
                        <div className="flex gap-2">
                            <button disabled={qPage <= 1} onClick={() => setQPage(p=>p-1)} className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50">Precedente</button>
                            <span className="px-3 py-1 text-gray-300">Pagina {qPage}</span>
                            <button disabled={qPage * 15 >= queriesTotal} onClick={() => setQPage(p=>p+1)} className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50">Successiva</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUADTREE VISUALIZER */}
            <QuadtreeVisualizer jobId={jobId} />

            {/* ACTIVITY FEED */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">ACTIVITY FEED</h2>
                <div className="h-64 overflow-y-auto pr-2 space-y-2 font-mono text-sm">
                    {events.length === 0 ? (
                        <div className="text-gray-500">Nessun evento registrato.</div>
                    ) : (
                        events.map(ev => (
                            <div key={ev.id} className="flex gap-4 p-2 hover:bg-gray-700/50 rounded">
                                <div className="text-gray-500 whitespace-nowrap">{new Date(ev.timestamp).toLocaleTimeString()}</div>
                                <div className={`font-bold ${ev.type === 'ERROR' ? 'text-red-400' : ev.type === 'PLANNER' ? 'text-purple-400' : ev.type === 'SUCCESS' ? 'text-green-400' : 'text-blue-400'}`}>
                                    [{ev.type}]
                                </div>
                                <div className="text-gray-300 flex-1">{ev.message}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}











