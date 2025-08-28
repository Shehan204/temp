import { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import Modal from '../Shared/Modal';

export default function NodeEditor() {
  // Destructure state and actions from the store
  const { selectedNode, nodes, updateNode } = useStore();

  // Local state for node content and routes
  const [content, setContent] = useState('');
  const [routes, setRoutes] = useState([]);

  // Effect to update local state when the selected node changes
  useEffect(() => {
    if (selectedNode) {
      // Find the selected node in the nodes array
      const node = nodes.find((n) => n.id === selectedNode);
      if (node) {
        // Update local state with the node's content and routes
        setContent(node.content);
        setRoutes(node.routes || []);
      }
    }
  }, [selectedNode, nodes]); // Added 'nodes' to the dependency array

  // Handler to save changes to the node
  const handleSave = () => {
    if (selectedNode) {
      // Update the node in the store with the new content and routes
      updateNode(selectedNode, { content, routes });
      // Clear the selected node to close the editor
      useStore.setState({ selectedNode: null });
    }
  };

  return (
    <Modal
      isOpen={!!selectedNode}
      onClose={() => useStore.setState({ selectedNode: null })}
    >
      <div className="node-editor">
        <h2>Edit Node</h2>
        {/* Textarea for editing the node's content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Scene description..."
        />
        {/* Section for managing routes */}
        <div className="routes-section">
          <h3>Routes</h3>
          {/* Placeholder for route management implementation */}
          <p>Route management will be implemented here.</p>
        </div>
        {/* Button to save changes */}
        <button onClick={handleSave}>Save Changes</button>
      </div>
    </Modal>
  );
}