import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import useStore from '../../stores/useStore';
import './Node.css';

const Node = memo(({ id, x, y, title, description, type, isPreview = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState({ title: false, description: false });
  const [editedContent, setEditedContent] = useState({ title, description });
  const nodeRef = useRef(null);

  const {
    zoomLevel,
    updateNodePosition,
    removeNode,
    setDraggingConnection,
    updateNodeTitle,
    updateNodeDescription
  } = useStore();

  // Connection handling
  const startConnection = useCallback((e) => {
    if (isPreview) return;
    e.stopPropagation();
    
    const canvas = document.querySelector('.canvas-container');
    const connectionDot = e.currentTarget.querySelector('.connection-dot');
    const dotRect = connectionDot.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    setDraggingConnection({
      fromId: id,
      startX: (dotRect.left - canvasRect.left + canvas.scrollLeft) / zoomLevel,
      startY: (dotRect.top - canvasRect.top + canvas.scrollTop) / zoomLevel,
      currentX: (dotRect.left - canvasRect.left + canvas.scrollLeft) / zoomLevel,
      currentY: (dotRect.top - canvasRect.top + canvas.scrollTop) / zoomLevel
    });
  }, [id, zoomLevel, isPreview, setDraggingConnection]);

  // Dragging handling
  const handleDragStart = useCallback((e) => {
    if (isPreview || e.target.closest('.delete-node, .connection-point')) return;

    const canvas = document.querySelector('.canvas-container');
    const canvasRect = canvas.getBoundingClientRect();
    const scale = zoomLevel;

    setOffset({
      x: (e.clientX - canvasRect.left + canvas.scrollLeft) / scale - x,
      y: (e.clientY - canvasRect.top + canvas.scrollTop) / scale - y
    });
    setIsDragging(true);
  }, [x, y, zoomLevel, isPreview]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || isPreview) return;

    const canvas = document.querySelector('.canvas-container');
    const canvasRect = canvas.getBoundingClientRect();
    const scale = zoomLevel;

    const newX = (e.clientX - canvasRect.left + canvas.scrollLeft) / scale - offset.x;
    const newY = (e.clientY - canvasRect.top + canvas.scrollTop) / scale - offset.y;

    updateNodePosition(id, newX, newY);
  }, [isDragging, offset, id, updateNodePosition, zoomLevel, isPreview]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Edit handling
  const handleEditStart = (field) => {
    if (isPreview) return;
    setIsEditing(prev => ({ ...prev, [field]: true }));
  };

  const handleEditBlur = (field) => {
    if (field === 'title') {
      updateNodeTitle(id, editedContent.title);
    } else {
      updateNodeDescription(id, editedContent.description);
    }
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  // Delete handling
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (window.confirm('Delete this node and its connections?')) {
      removeNode(id);
    }
  }, [id, removeNode]);

  // Event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd ]);

  return (
    <div
      className={`node-wrapper ${isPreview ? 'preview' : ''}`}
      style={{ left: x, top: y }}
      data-node-id={id}
      ref={nodeRef}
    >
      <div
        className={`node ${isDragging ? 'dragging' : ''} ${isPreview ? ' preview' : ''}`}
        data-node-type={type.toLowerCase()}
        onMouseDown={!isPreview ? handleDragStart : undefined}
      >
        <div className="node-header">
          <span className="node-type-badge">{type}</span>
          {!isPreview && (
 <button className="delete-node" onClick={handleDelete}>
              ×
            </button>
          )}
        </div>

        <div className="node-content">
          {isEditing.title ? (
            <input
              className="node-title-input"
              value={editedContent.title}
              onChange={(e) => setEditedContent(p => ({ ...p, title: e.target.value }))}
              onBlur={() => handleEditBlur('title')}
              autoFocus
            />
          ) : (
            <h3 className="node-title" onClick={() => handleEditStart('title')}>
              {editedContent.title || "Untitled Node"}
            </h3>
          )}

          {isEditing.description ? (
            <textarea
              className="node-description-input"
              value={editedContent.description}
              onChange={(e) => setEditedContent(p => ({ ...p, description: e.target.value }))}
              onBlur={() => handleEditBlur('description')}
              autoFocus
            />
          ) : (
            <div className="node-description" onClick={() => handleEditStart('description')}>
              {editedContent.description || "Click to add description"}
            </div>
          )}
        </div>

        {!isPreview && (
          <div className="connection-point" onMouseDown={startConnection}>
            <div className="connection-dot" />
          </div>
        )}
      </div>
    </div>
  );
});

export default Node;