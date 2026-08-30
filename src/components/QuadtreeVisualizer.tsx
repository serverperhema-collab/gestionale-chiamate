'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';

type QuadtreeNode = {
    id: string; geoCellId: string; parentGeoCellId: string | null; geoDepth: number;
    cellMinLat: number; cellMaxLat: number; cellMinLng: number; cellMaxLng: number;
    searchCenterLat: number; searchCenterLng: number; searchRadius: number;
    status: string; resultCount: number | null; newResultCount: number | null;
    actualYield: number | null; strategy: string; priority: number | null;
    plannerReason: string | null; queryText: string;
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'rgba(156, 163, 175, 0.4)', // gray-400
    RUNNING: 'rgba(250, 204, 21, 0.6)', // yellow-400
    PAGE_LIMIT_REACHED: 'rgba(249, 115, 22, 0.6)', // orange-500
    LOW_YIELD: 'rgba(202, 138, 4, 0.6)', // yellow-600
    BRANCH_CLOSED: 'rgba(74, 222, 128, 0.4)', // green-400
    FAILED: 'rgba(248, 113, 113, 0.6)' // red-400
};

const STATUS_STROKE: Record<string, string> = {
    PENDING: '#9ca3af', RUNNING: '#facc15', PAGE_LIMIT_REACHED: '#f97316',
    LOW_YIELD: '#ca8a04', BRANCH_CLOSED: '#4ade80', FAILED: '#f87171'
};

export default function QuadtreeVisualizer({ jobId }: { jobId: string }) {
    const [nodes, setNodes] = useState<QuadtreeNode[]>([]);
    const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'MAP' | 'TREE'>('MAP');

    // Pan & Zoom state
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const fetchQuadtree = async () => {
        try {
            const res = await fetch(`/api/scrape/v2/jobs/${jobId}/quadtree`);
            const data = await res.json();
            if (data.success) {
                setNodes(data.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchQuadtree();
        const interval = setInterval(fetchQuadtree, 3000);
        return () => clearInterval(interval);
    }, [jobId]);

    // Bounds calculation
    const bounds = useMemo(() => {
        if (nodes.length === 0) return null;
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        nodes.forEach(n => {
            if (n.cellMinLat < minLat) minLat = n.cellMinLat;
            if (n.cellMaxLat > maxLat) maxLat = n.cellMaxLat;
            if (n.cellMinLng < minLng) minLng = n.cellMinLng;
            if (n.cellMaxLng > maxLng) maxLng = n.cellMaxLng;
        });
        return { minLat, maxLat, minLng, maxLng };
    }, [nodes]);

    // Fit to bounds
    const resetView = () => {
        setScale(1);
        setPan({ x: 0, y: 0 });
    };

    const handleZoom = (factor: number) => {
        setScale(s => Math.max(0.1, s * factor));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const SVG_SIZE = 600;
    
    // Renders the nodes on SVG
    const renderMap = () => {
        if (!bounds) return <div className="text-gray-500">Nessuna cella trovata.</div>;
        
        const latRange = bounds.maxLat - bounds.minLat || 0.01;
        const lngRange = bounds.maxLng - bounds.minLng || 0.01;
        
        // Mantieni proporzioni
        const ratio = lngRange / latRange;
        let width = SVG_SIZE;
        let height = SVG_SIZE;
        if (ratio > 1) height = SVG_SIZE / ratio;
        else width = SVG_SIZE * ratio;

        const mapLngToX = (lng: number) => ((lng - bounds.minLng) / lngRange) * width;
        const mapLatToY = (lat: number) => (1 - ((lat - bounds.minLat) / latRange)) * height;

        return (
            <div className="relative border border-gray-700 bg-gray-900 rounded-lg overflow-hidden" 
                 style={{ width: '100%', height: '600px', cursor: isDragging.current ? 'grabbing' : 'grab' }}
                 onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <svg width="100%" height="100%">
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                        {/* Centered Map Group */}
                        <g transform={`translate(${(SVG_SIZE - width)/2}, ${(SVG_SIZE - height)/2})`}>
                            {nodes.map(node => {
                                const x1 = mapLngToX(node.cellMinLng);
                                const x2 = mapLngToX(node.cellMaxLng);
                                const y1 = mapLatToY(node.cellMaxLat);
                                const y2 = mapLatToY(node.cellMinLat);
                                
                                const isSelected = selectedCellId === node.geoCellId;

                                return (
                                    <rect 
                                        key={node.geoCellId}
                                        x={x1} y={y1} width={x2-x1} height={y2-y1}
                                        fill={STATUS_COLORS[node.status] || 'transparent'}
                                        stroke={isSelected ? '#fff' : STATUS_STROKE[node.status] || '#555'}
                                        strokeWidth={isSelected ? 3 / scale : 1 / scale}
                                        onClick={() => setSelectedCellId(node.geoCellId)}
                                        className="transition-colors hover:fill-blue-500/30 cursor-pointer"
                                    >
                                        <title>{node.geoCellId} ({node.status})</title>
                                    </rect>
                                );
                            })}
                        </g>
                    </g>
                </svg>
                {/* Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button onClick={() => handleZoom(1.2)} className="bg-gray-800 border border-gray-600 text-white w-8 h-8 rounded">+</button>
                    <button onClick={() => handleZoom(0.8)} className="bg-gray-800 border border-gray-600 text-white w-8 h-8 rounded">-</button>
                    <button onClick={resetView} className="bg-gray-800 border border-gray-600 text-white p-2 text-xs rounded">RESET</button>
                </div>
            </div>
        );
    };

    // Render tree recursively
    const buildTree = (parentId: string | null) => {
        const children = nodes.filter(n => n.parentGeoCellId === parentId);
        if (children.length === 0) return null;
        return (
            <ul className="pl-6 border-l border-gray-700 ml-2 space-y-1 my-1">
                {children.map(child => {
                    const isSelected = selectedCellId === child.geoCellId;
                    return (
                        <li key={child.geoCellId}>
                            <div 
                                className={`cursor-pointer px-2 py-1 rounded text-sm flex gap-2 items-center ${isSelected ? 'bg-blue-900/50 border border-blue-500' : 'hover:bg-gray-800'}`}
                                onClick={() => setSelectedCellId(child.geoCellId)}
                            >
                                <span className="text-gray-500 font-mono text-xs">D{child.geoDepth}</span>
                                <span style={{color: STATUS_STROKE[child.status]}} className="font-bold">[{child.status}]</span>
                                <span className="text-gray-300">{child.geoCellId}</span>
                            </div>
                            {buildTree(child.geoCellId)}
                        </li>
                    );
                })}
            </ul>
        );
    };

    const selectedNode = nodes.find(n => n.geoCellId === selectedCellId);

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Esplorazione Geografica (Quadtree)</h2>
                <div className="flex gap-2 bg-gray-900 rounded p-1">
                    <button onClick={() => setViewMode('MAP')} className={`px-4 py-1 rounded text-sm ${viewMode === 'MAP' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Mappa</button>
                    <button onClick={() => setViewMode('TREE')} className={`px-4 py-1 rounded text-sm ${viewMode === 'TREE' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Albero</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    {viewMode === 'MAP' ? renderMap() : (
                        <div className="border border-gray-700 bg-gray-900 p-4 rounded-lg h-[600px] overflow-auto">
                            {buildTree(null)}
                        </div>
                    )}
                </div>
                
                {/* Drawer / Panel Details */}
                <div className="w-full md:w-80 bg-gray-900 border border-gray-700 p-4 rounded-lg flex flex-col gap-4">
                    <h3 className="font-bold text-lg text-white border-b border-gray-700 pb-2">Dettagli Cella</h3>
                    
                    {selectedNode ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <div className="text-gray-500 text-xs">GeoCell ID</div>
                                <div className="font-mono text-blue-300 break-all">{selectedNode.geoCellId}</div>
                            </div>
                            {selectedNode.parentGeoCellId && (
                                <div>
                                    <div className="text-gray-500 text-xs">Parent GeoCell ID</div>
                                    <div 
                                        className="font-mono text-gray-300 hover:text-blue-400 cursor-pointer break-all"
                                        onClick={() => setSelectedCellId(selectedNode.parentGeoCellId)}
                                    >
                                        {selectedNode.parentGeoCellId}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-gray-500 text-xs">Depth</span><br/><span className="text-gray-300">{selectedNode.geoDepth}</span></div>
                                <div><span className="text-gray-500 text-xs">Stato</span><br/><span style={{color: STATUS_STROKE[selectedNode.status]}} className="font-bold">{selectedNode.status}</span></div>
                                <div><span className="text-gray-500 text-xs">Risultati</span><br/><span className="text-gray-300">{selectedNode.resultCount ?? '-'}</span></div>
                                <div><span className="text-gray-500 text-xs">Nuovi</span><br/><span className="text-green-400 font-bold">{selectedNode.newResultCount ?? '-'}</span></div>
                                <div><span className="text-gray-500 text-xs">Yield</span><br/><span className="text-gray-300">{selectedNode.actualYield ? (selectedNode.actualYield*100).toFixed(1)+'%' : '-'}</span></div>
                                <div><span className="text-gray-500 text-xs">Priority</span><br/><span className="text-purple-400 font-mono">{selectedNode.priority?.toFixed(3) ?? '-'}</span></div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Bounding Box</div>
                                <div className="font-mono text-xs text-gray-400">
                                    Min: {selectedNode.cellMinLat.toFixed(6)}, {selectedNode.cellMinLng.toFixed(6)}<br/>
                                    Max: {selectedNode.cellMaxLat.toFixed(6)}, {selectedNode.cellMaxLng.toFixed(6)}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Centro & Raggio API</div>
                                <div className="font-mono text-xs text-gray-400">
                                    C: {selectedNode.searchCenterLat.toFixed(6)}, {selectedNode.searchCenterLng.toFixed(6)}<br/>
                                    R: {selectedNode.searchRadius.toFixed(0)}m
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs mb-1">Motivazione Planner</div>
                                <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">{selectedNode.plannerReason || 'Nessuna motivazione'}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 italic text-sm text-center mt-10">
                            Seleziona una cella dalla mappa o dall'albero per vederne i dettagli.
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 flex gap-4 text-xs">
                {Object.keys(STATUS_COLORS).map(s => (
                    <div key={s} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: STATUS_STROKE[s]}}></div>
                        <span className="text-gray-400">{s}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
