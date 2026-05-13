import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import GraphViewer from './components/GraphViewer';

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
        }
      } else if (message.type === 'highlightNode') {
        setActiveLine(message.payload.line);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ErrorBoundary>
        {graphData ? <GraphViewer data={graphData} activeLine={activeLine} /> : <div style={{ padding: '20px', color: '#94a3b8' }}>Waiting for code changes...</div>}
      </ErrorBoundary>
    </div>
  );
}

export default App;
