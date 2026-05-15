import { X, ExternalLink } from 'lucide-react';

interface SidebarProps {
  selectedNode: any;
  onClose: () => void;
  onJumpToCode: (line: number) => void;
  metadata: any;
}

export default function Sidebar({ selectedNode, onClose, onJumpToCode, metadata }: SidebarProps) {
  if (!selectedNode) return null;

  const { data } = selectedNode;
  const theme = metadata.themes[data.type] || { color: '#64748b' };

  return (
    <div style={{
      width: '320px',
      height: '100%',
      background: 'rgba(15, 23, 42, 0.95)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.4)',
      zIndex: 10
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: theme.color 
          }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{data.label}</h2>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Metadata
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <AttributeRow label="Type" value={data.type} color={theme.color} />
            {Object.entries(metadata.attributeMappings).map(([key, label]: [string, any]) => {
              const val = data[key] || data.metadata?.[key];
              if (val === undefined) return null;
              return <AttributeRow key={key} label={label} value={val.toString()} />;
            })}
          </div>
        </section>

        {data.metadata?.elements && data.metadata.elements.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Collection Elements
            </h3>
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.5)', 
              borderRadius: '6px', 
              padding: '8px',
              fontSize: '13px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              {data.metadata.elements.map((el: any, i: number) => (
                <span key={i} style={{ 
                  background: 'rgba(59, 130, 246, 0.2)', 
                  color: '#93c5fd', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>{el}</span>
              ))}
            </div>
          </section>
        )}

        {data.startLine && (
          <button 
            onClick={() => onJumpToCode(data.startLine)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ExternalLink size={14} />
            Jump to Line {data.startLine}
          </button>
        )}
      </div>
    </div>
  );
}

function AttributeRow({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ fontWeight: 500, color: color || '#f8fafc' }}>{value}</span>
    </div>
  );
}
