import useStore from './stores/useStore';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import NodeEditor from './components/NodeEditor';
import ErrorBoundary from './ErrorBoundary';
import { ConfirmationProvider } from './components/Shared/ConfirmationDialog';

export default function App() {
  const selectedNode = useStore(state => state.selectedNode);
  
  return (
    <ConfirmationProvider>
      <div className="app-container">
        <Toolbar />
        <ErrorBoundary>
          <Canvas />
        </ErrorBoundary>
        {selectedNode && <NodeEditor />}
      </div>
    </ConfirmationProvider>
  );
}