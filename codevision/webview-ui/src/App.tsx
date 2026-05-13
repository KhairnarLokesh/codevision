import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import GraphViewer from './components/GraphViewer';
import D3LinearViewer from './components/D3LinearViewer';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: '20px' }}>
        <h2>Something went wrong.</h2>
        <pre>{this.state.error?.toString()}</pre>
        <pre>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

interface VSCodeMessage {
  type: string;
  payload: any;
}

const getVscodeApi = () => {
  if (!(window as any).__vscode) {
    (window as any).__vscode = (window as any).acquireVsCodeApi ? (window as any).acquireVsCodeApi() : null;
  }
  return (window as any).__vscode;
};

function App() {
  const [graphData, setGraphData] = useState<any>(null);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [visitedHistory, setVisitedHistory] = useState<any[]>([]);

  useEffect(() => {
    const vscode = getVscodeApi();
    if (vscode) {
      vscode.postMessage({ command: 'ready' });
    }

    const handleMessage = (event: MessageEvent<VSCodeMessage>) => {
      const message = event.data;
      if (message.type === 'updateGraph') {
        if (message.payload.graph !== undefined) {
          setGraphData(message.payload.graph);
          setVisitedHistory([]);
        }
      } else if (message.type === 'debugUpdate') {
        const { line, nodeData } = message.payload;
        setActiveLine(line);
        if (nodeData) {
          setVisitedHistory(prev => {
            const last = prev[prev.length - 1];
            if (last?.line !== line) {
              return [...prev, { line, data: nodeData }];
            }
            return prev;
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ErrorBoundary>
        {graphData ? (
          graphData.metadata.diagramType === 'STACK' || graphData.metadata.diagramType === 'QUEUE' ? (
            <D3LinearViewer data={graphData} activeLine={activeLine} history={visitedHistory} />
          ) : (
            <GraphViewer data={graphData} activeLine={activeLine} history={visitedHistory} />
          )
        ) : (
          <div style={{ padding: '20px', color: '#94a3b8' }}>Waiting for code changes...</div>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default App;
