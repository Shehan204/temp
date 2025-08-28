    import React, { useEffect, useState } from 'react';
    import useStore from '../../stores/useStore';
    import Node from './Node';
    import ConnectionLine from './ConnectionLine';
    import './Canvas.css';

    const Canvas = () => {
        const [isPanning, setIsPanning] = useState(false);
        const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
        const [startScroll, setStartScroll] = useState({ left: 0, top: 0 });

        const { 
            nodes,
            connections,
            zoomLevel,
            draggingConnection,
            placingNodeType,
            previewPosition,
            addNode,
            cancelPlacement,
            updateConnectionPosition,
            setDraggingConnection,
            addConnection,
            setPreviewPosition
        } = useStore();

        const getCanvasData = () => {
            const canvas = document.querySelector('.canvas-container');
            if (!canvas) return null;
            
            return {
                rect: canvas.getBoundingClientRect(),
                scrollLeft: canvas.scrollLeft,
                scrollTop: canvas.scrollTop
            };
        };

        const handleCanvasClick = (e) => {
            if (placingNodeType && document.querySelector('.canvas-container').contains(e.target)) {
                const canvasData = getCanvasData();
                if (!canvasData) return;

                const { rect, scrollLeft, scrollTop } = canvasData;
                const zoom = zoomLevel;
                
                const rawX = e.clientX - rect.left + scrollLeft;
                const rawY = e.clientY - rect.top + scrollTop;
                
                addNode({
                    id: Date.now(),
                    type: placingNodeType,
                    x: rawX / zoom,
                    y: rawY / zoom,
                    title: `${placingNodeType} Node`,
                    description: '',
                    routes: placingNodeType === 'Scene' ? ['', ''] : []
                });

                cancelPlacement();
            }
        };

        const handlePanStart = (e) => {
            if (placingNodeType) return;
            
            if (e.target.closest('.node') || draggingConnection) return;
            setIsPanning(true);
            setStartPanPoint({ x: e.clientX, y: e.clientY });
            const container = e.currentTarget;
            setStartScroll({
                left: container.scrollLeft,
                top: container.scrollTop
            });
        };

        const handlePanMove = (e) => {
            if (!isPanning) return;
            const dx = e.clientX - startPanPoint.x;
            const dy = e.clientY - startPanPoint.y;
            
            const container = document.querySelector('.canvas-container');
            container.scrollLeft = startScroll.left - dx;
            container.scrollTop = startScroll.top - dy;
        };

        const handlePanEnd = () => {
            setIsPanning(false);
        };

        useEffect(() => {
            const updatePreview = (e) => {
                if (!placingNodeType) return;
                
                const canvasData = getCanvasData();
                if (!canvasData) return;

                const { rect, scrollLeft, scrollTop } = canvasData;
                const zoom = zoomLevel;

                const rawX = e.clientX - rect.left + scrollLeft;
                const rawY = e.clientY - rect.top + scrollTop;

                setPreviewPosition({
                    x: rawX / zoom,
                    y: rawY / zoom
                });
            };

            document.addEventListener('mousemove', updatePreview);
            return () => document.removeEventListener('mousemove', updatePreview);
        }, [placingNodeType, zoomLevel, setPreviewPosition]);

        useEffect(() => {
            const handleMouseMove = (e) => {
                if (!draggingConnection) return;
                
                const canvasData = getCanvasData();
                if (!canvasData) return;

                const { rect, scrollLeft, scrollTop } = canvasData;
                const zoom = zoomLevel;

                const rawX = e.clientX - rect.left + scrollLeft;
                const rawY = e.clientY - rect.top + scrollTop;

                updateConnectionPosition(rawX / zoom, rawY / zoom);
            };

            const handleMouseUp = (e) => {
                if (!draggingConnection) return;

                const target = document.elementFromPoint(e.clientX, e.clientY);
                const connectionDot = target?.closest('.connection-dot');
                const toNode = connectionDot?.closest('.node-wrapper');
                const toId = toNode?.dataset?.nodeId ? parseInt(toNode.dataset.nodeId) : null;

                if (toId && toId !== draggingConnection.fromId) {
                    addConnection({
                        from: draggingConnection.fromId,
                        to: toId
                    });
                }
                setDraggingConnection(null);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }, [draggingConnection, zoomLevel, addConnection, setDraggingConnection, updateConnectionPosition]);

        useEffect(() => {
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    cancelPlacement();
                    setPreviewPosition(null);
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, [cancelPlacement, setPreviewPosition]);

        return (
            <div 
                className="canvas-container"
                onMouseDown={handlePanStart}
                onClick={handleCanvasClick}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
            >
                <div 
                    className="canvas" 
                    style={{ 
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: '0 0'
                    }}
                >
                    <div className="grid" />
                    
                    <svg className="connections-layer">
                        {connections.map(connection => (
                            <ConnectionLine 
                                key={`${connection.id}`} 
                                connection={connection} 
                            />
                        ))}
                        {draggingConnection && (
                            <ConnectionLine
                                isTemp
                                x1={draggingConnection.startX}
                                y1={draggingConnection.startY}
                                x2={draggingConnection.currentX}
                                y2={draggingConnection.currentY}
                                stroke="#3b82f6"
                            />
                        )}
                    </svg>

                    {nodes.map(node => (
                        <Node 
                            key={node.id} 
                            id={node.id}
                            x={node.x}
                            y={node.y}
                            title={node.title}
                            description={node.description}
                            type={node.type}
                            routes={node.routes}
                        />
                    ))}

                    {placingNodeType && previewPosition && (
                        <Node 
                            id="preview"
                            x={previewPosition.x}
                            y={previewPosition.y}
                            title={`New ${placingNodeType}`}
                            description="Click to place"
                            type={placingNodeType}
                            isPreview
                        />
                    )}
                </div>
            </div>
        );
    };

    export default Canvas;