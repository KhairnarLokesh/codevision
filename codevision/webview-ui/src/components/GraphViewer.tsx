import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Activity, Box, FileCode, Database, Server } from 'lucide-react';
import * as dagre from 'dagre';

const getVscodeApi = () => {
  if (!(window as any).__vscode) {
    (window as any).__vscode = (window as any).acquireVsCodeApi ? (window as any).acquireVsCodeApi() : null;
  }
  return (window as any).__vscode;
};

const CustomNode = ({ data }: any) => {
  let icon = <Box size={16} />;
  let color = '#3b82f6'; // Default
  let glow = '';

  if (data.type === 'Class') {
    icon = <Box size={16} />;
    color = '#3b82f6';
  } else if (data.type === 'Object' || data.type === 'Instance') {
    icon = <Box size={16} />;
    color = '#22c55e';
  } else if (data.type === 'Function' || data.type === 'Method') {
    icon = <Activity size={16} />;
    color = '#a855f7';
  } else if (data.type === 'API') {
    icon = <Server size={16} />;
    color = '#f97316';
  } else if (data.type === 'Database') {
    icon = <Database size={16} />;
    color = '#ef4444';
  } else if (data.type === 'Null') {
    icon = <FileCode size={16} />;
    color = '#9ca3af';
  } else if (data.type === 'Active Execution') {
    icon = <Activity size={16} />;
    color = '#eab308';
    glow = '0 0 15px rgba(234, 179, 8, 0.6)';
  } else if (data.type === 'Variable') {
    icon = <FileCode size={16} />;
    color = '#f59e0b';
  }

  const handleNodeClick = () => {
    const vscodeApi = getVscodeApi();
    if (vscodeApi && data.startLine) {
      vscodeApi.postMessage({
        command: 'jumpToLine',
        line: data.startLine
      });
    }
  };

  return (
    <div 
      onClick={handleNodeClick}
      style={{
        background: 'rgba(30, 41, 59, 0.95)',
        border: `1px solid ${color}`,
        boxShadow: glow || `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 10px ${color}33`,
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        minWidth: '160px',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
        cursor: data.startLine ? 'pointer' : 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 12px -2px rgba(0, 0, 0, 0.2), 0 0 15px ${color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = glow || `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 10px ${color}33`;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(248,250,252,0.1)', paddingBottom: '8px' }}>
        <div style={{ color: color }}>{icon}</div>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{data.label}</span>
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
        <span>{data.type}</span>
        {data.startLine && <span>Line {data.startLine}</span>}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: '8px', height: '8px' }} />
    </div>
  );
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreLib = (dagre as any).default || dagre; // Fallback for Vite UMD bundling
  if (!dagreLib || !dagreLib.graphlib) {
    // Fallback Grid Layout
    nodes.forEach((node, index) => {
      node.targetPosition = direction === 'TB' ? Position.Top : Position.Left;
      node.sourcePosition = direction === 'TB' ? Position.Bottom : Position.Right;
      node.position = { x: (index % 3) * 250, y: Math.floor(index / 3) * 150 };
    });
    return { nodes, edges };
  }

  const dagreGraph = new dagreLib.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 180;
  const nodeHeight = 80;

  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node: any) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge: any) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagreLib.layout(dagreGraph);

  nodes.forEach((node: any) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'TB' ? Position.Top : Position.Left;
    node.sourcePosition = direction === 'TB' ? Position.Bottom : Position.Right;

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

export default function GraphViewer({ data }: { data: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    if (data && data.entities) {
      const direction = data.metadata?.recommendedLayout || 'TB';
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        data.entities,
        data.relationships,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    }
  }, [data]);

  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {data.metadata && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 4,
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#e2e8f0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>
            {data.metadata.diagramType.replace('_', ' ')}
          </div>
          <div style={{ display: 'flex', gap: '12px', color: '#94a3b8' }}>
            <span>Confidence: <strong style={{color: '#fff'}}>{Math.round(data.metadata.confidence * 100)}%</strong></span>
            <span>Layout: <strong style={{color: '#fff'}}>{data.metadata.recommendedLayout}</strong></span>
          </div>
          {data.metadata.patterns?.length > 0 && (
             <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
               {data.metadata.patterns.map((p: string) => (
                 <span key={p} style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                   {p}
                 </span>
               ))}
             </div>
          )}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#334155" />
        <Controls />
        <MiniMap 
          nodeColor={(n) => {
            if (n.data?.type === 'Class') return '#3b82f6';
            if (n.data?.type === 'Object' || n.data?.type === 'Instance') return '#22c55e';
            if (n.data?.type === 'Function') return '#a855f7';
            return '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </ReactFlow>
    </div>
  );
}
