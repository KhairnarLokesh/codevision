import { useMemo, useEffect, useState } from 'react';
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
import { Activity, Box, FileCode, Database, Server, Layers, Link as LinkIcon, Circle, Grid } from 'lucide-react';
import * as dagre from 'dagre';
import Sidebar from './Sidebar';
import visualizationMetadata from '../metadata.json';

const getVscodeApi = () => {
  if (!(window as any).__vscode) {
    (window as any).__vscode = (window as any).acquireVsCodeApi ? (window as any).acquireVsCodeApi() : null;
  }
  return (window as any).__vscode;
};

const CustomNode = ({ data, selected }: any) => {
  const theme = (visualizationMetadata.themes as any)[data.type] || { color: '#64748b', icon: 'Box' };
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Box': return <Box size={14} />;
      case 'Activity': return <Activity size={14} />;
      case 'Layers': return <Layers size={14} />;
      case 'Link': return <LinkIcon size={14} />;
      case 'Circle': return <Circle size={14} />;
      case 'Grid': return <Grid size={14} />;
      case 'Database': return <Database size={14} />;
      case 'Server': return <Server size={14} />;
      default: return <Box size={14} />;
    }
  };

  const isNeuralLayer = ['Conv', 'Linear', 'Dense', 'ReLU', 'Softmax', 'MaxPool', 'AvgPool', 'BatchNormalization', 'Concat', 'Reshape'].includes(data.type);

  if (isNeuralLayer) {
    return (
      <div 
        style={{
          background: '#2d2d2d',
          border: `1px solid ${selected ? '#fff' : '#1a1a1a'}`,
          borderRadius: '4px',
          color: '#dfdfdf',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          minWidth: '140px',
          boxShadow: selected ? '0 0 10px rgba(255,255,255,0.3)' : '0 2px 5px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          transition: 'all 0.15s ease-in-out'
        }}
      >
        {/* Header */}
        <div style={{ 
          background: theme.color, 
          padding: '4px 8px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          <span>{data.type}</span>
          {getIcon(theme.icon)}
        </div>
        
        {/* Body */}
        <div style={{ padding: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: '#fff' }}>
            {data.label}
          </div>
          
          {(data.metadata?.weights || data.metadata?.biases) && (
            <div style={{ marginTop: '6px', borderTop: '1px solid #444', paddingTop: '6px' }}>
              {data.metadata.weights && (
                <div style={{ display: 'flex', gap: '4px', fontSize: '10px', color: '#aaa', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 800, color: '#dfdfdf' }}>W</span>
                  <span>{data.metadata.weights}</span>
                </div>
              )}
              {data.metadata.biases && (
                <div style={{ display: 'flex', gap: '4px', fontSize: '10px', color: '#aaa' }}>
                  <span style={{ fontWeight: 800, color: '#dfdfdf' }}>B</span>
                  <span>{data.metadata.biases}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Handle type="target" position={Position.Top} style={{ background: '#888', border: '1px solid #2d2d2d', width: '6px', height: '6px' }} />
        <Handle type="source" position={Position.Bottom} style={{ background: '#888', border: '1px solid #2d2d2d', width: '6px', height: '6px' }} />
      </div>
    );
  }

  // Fallback for regular nodes
  return (
    <div 
      style={{
        background: 'rgba(30, 41, 59, 0.95)',
        border: `2px solid ${selected ? '#fff' : theme.color}`,
        borderRadius: '8px',
        padding: '0',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        minWidth: '180px',
        overflow: 'hidden',
        boxShadow: selected ? `0 0 15px ${theme.color}` : 'none',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        padding: '8px 12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ color: theme.color }}>{getIcon(theme.icon)}</div>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>{data.label}</span>
      </div>
      
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {data.type}
        </div>
      </div>

      <Handle type="target" position={Position.Top} style={{ background: theme.color, border: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: theme.color, border: 'none' }} />
    </div>
  );
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreLib = (dagre as any).default || dagre;
  if (!dagreLib || !dagreLib.graphlib) return { nodes, edges };

  const dagreGraph = new dagreLib.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });

  nodes.forEach((node: any) => {
    const isNeuralLayer = ['Conv', 'Linear', 'Dense', 'ReLU', 'Softmax', 'MaxPool', 'AvgPool', 'BatchNormalization', 'Concat', 'Reshape'].includes(node.data?.type);
    const width = isNeuralLayer ? 160 : 200;
    const height = isNeuralLayer ? 80 : 100;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge: any) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagreLib.layout(dagreGraph);

  nodes.forEach((node: any) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isNeuralLayer = ['Conv', 'Linear', 'Dense', 'ReLU', 'Softmax', 'MaxPool', 'AvgPool', 'BatchNormalization', 'Concat', 'Reshape'].includes(node.data?.type);
    const width = isNeuralLayer ? 160 : 200;
    const height = isNeuralLayer ? 80 : 100;

    node.targetPosition = direction === 'TB' ? Position.Top : Position.Left;
    node.sourcePosition = direction === 'TB' ? Position.Bottom : Position.Right;

    node.position = {
      x: nodeWithPosition.x - width / 2,
      y: nodeWithPosition.y - height / 2,
    };
  });

  return { nodes, edges };
};

export default function GraphViewer({ data }: { data: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

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

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
  };

  const handleJumpToCode = (line: number) => {
    const vscodeApi = getVscodeApi();
    if (vscodeApi) {
      vscodeApi.postMessage({
        command: 'jumpToLine',
        line: line
      });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', overflow: 'hidden', background: '#1a1a1a' }}>
      <div style={{ flex: 1, position: 'relative' }}>
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
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>
              {data.metadata.diagramType.replace(/_/g, ' ')}
            </div>
            <div style={{ display: 'flex', gap: '12px', color: '#94a3b8' }}>
              <span>Confidence: <strong style={{color: '#fff'}}>{Math.round(data.metadata.confidence * 100)}%</strong></span>
            </div>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#334155" />
          <Controls />
          <MiniMap 
            nodeColor={(n: any) => {
              const theme = (visualizationMetadata.themes as any)[n.data?.type] || { color: '#64748b' };
              return theme.color;
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </ReactFlow>
      </div>
      
      <Sidebar 
        selectedNode={selectedNode} 
        onClose={() => setSelectedNode(null)} 
        onJumpToCode={handleJumpToCode}
        metadata={visualizationMetadata}
      />
    </div>
  );
}
