import React, { memo, useEffect, useState } from 'react';
import useStore from '../../stores/useStore';
import { useConfirmation } from '../Shared/ConfirmationDialog';

const ConnectionLine = memo(({ connection, isTemp, x1, y1, x2, y2 }) => {
    const { nodes, zoomLevel, removeConnection } = useStore(state => ({
        nodes: state.nodes,
        zoomLevel: state.zoomLevel,
        removeConnection: state.removeConnection
    }));

    const [calculatedPoints, setCalculatedPoints] = useState(null);
    const [strokeColor, setStrokeColor] = useState('#3b82f6');
    const confirm = useConfirmation();

    useEffect(() => {
        const calculateConnectionPoints = () => {
            // For temporary connections during drag
            if (isTemp) {
                setCalculatedPoints({
                    x1: x1 * zoomLevel,
                    y1: y1 * zoomLevel,
                    x2: x2 * zoomLevel,
                    y2: y2 * zoomLevel
                });
                return;
            }

            // For permanent connections
            if (!connection) return;

            const toNode = nodes.find(n => n.id === connection.to);
            const fromNode = nodes.find(n => n.id === connection.from);
            
            if (!toNode || !fromNode) {
                setCalculatedPoints(null);
                return;
            }

            // Determine stroke color based on target node type
            const newColor = {
                'goodending': '#10b981',
                'badending': '#ef4444',
                'home': '#f59e0b'
            }[toNode.type.toLowerCase()] || '#3b82f6';
            setStrokeColor(newColor);

            // Calculate positions with proper zoom and scroll accounting
            const calculatePositions = () => {
                const canvas = document.querySelector('.canvas-container');
                if (!canvas) return null;

                const fromEl = document.querySelector(`[data-node-id="${fromNode.id}"] .connection-dot`);
                const toEl = document.querySelector(`[data-node-id="${toNode.id}"] .connection-dot`);
                
                if (!fromEl || !toEl) return null;

                const canvasRect = canvas.getBoundingClientRect();
                const fromRect = fromEl.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();

                return {
                    x1: (fromRect.left + fromRect.width/2 - canvasRect.left + canvas.scrollLeft) / zoomLevel,
                    y1: (fromRect.top + fromRect.height/2 - canvasRect.top + canvas.scrollTop) / zoomLevel,
                    x2: (toRect.left + toRect.width/2 - canvasRect.left + canvas.scrollLeft) / zoomLevel,
                    y2: (toRect.top + toRect.height/2 - canvasRect.top + canvas.scrollTop) / zoomLevel
                };
            };

            // Retry calculation if elements not immediately available
            let attempts = 0;
            const tryCalculation = () => {
                const points = calculatePositions();
                if (points || attempts > 3) {
                    setCalculatedPoints(points);
                } else {
                    attempts++;
                    setTimeout(tryCalculation, 50);
                }
            };

            tryCalculation();
        };

        calculateConnectionPoints();
    }, [nodes, connection, zoomLevel, isTemp, x1, y1, x2, y2]);

    const handleDelete = async (e) => {
        e.stopPropagation();
        const shouldDelete = await confirm('Are you sure you want to delete this connection?');
        if (shouldDelete && connection?.id) {
            removeConnection(connection.id);
        }
    };

    if (!calculatedPoints || 
        calculatedPoints.x1 === undefined || 
        calculatedPoints.y1 === undefined || 
        calculatedPoints.x2 === undefined || 
        calculatedPoints.y2 === undefined) {
        return null;
    }

    return (
        <g 
            onClick={handleDelete}
            className="connection-group"
            style={{ cursor: 'pointer' }}
        >
            <line
                x1={calculatedPoints.x1}
                y1={calculatedPoints.y1}
                x2={calculatedPoints.x2}
                y2={calculatedPoints.y2}
                stroke={isTemp ? '#3b82f6' : strokeColor}
                strokeWidth={3.5}
                className={isTemp ? 'temporary-connection' : 'permanent-connection'}
            />
            <title>Click to delete connection</title>
        </g>
    );
});

export default ConnectionLine;