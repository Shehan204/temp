import { useState, useEffect } from 'react';
import useStore from '../../stores/useStore';
import Modal from '../Shared/Modal';

export default function NodeEditor() {
  const { selectedNode, nodes, updateNode } = useStore();
  const [description, setDescription] = useState('');
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode) || {};
      setDescription(node.description || '');
      setConnections(node.connections || []);
    }
  }, [selectedNode, nodes]);

  const handleSave = () => {
    if (selectedNode) {
      updateNode(selectedNode, {
        description,
        connections
      });
    }
    useStore.setState({ selectedNode: null });
  };

  return (
    <Modal isOpen={!!selectedNode} onClose={() => useStore.setState({ selectedNode: null })}>
      <div className="node-editor">
        <h2>Edit Node</h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter node description..."
        />
        <button className="styled-button" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </Modal>
  );
}