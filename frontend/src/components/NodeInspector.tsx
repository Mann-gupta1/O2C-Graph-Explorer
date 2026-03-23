import { X, Expand } from 'lucide-react';
import type { GraphNode } from '../types';
import { getNodeColor } from '../utils/colors';

interface NodeInspectorProps {
  node: GraphNode;
  onClose: () => void;
  onExpand: (nodeId: string) => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof value === 'string' && value.includes('T00:00:00')) {
    return value.split('T')[0];
  }
  return String(value);
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

export default function NodeInspector({ node, onClose, onExpand }: NodeInspectorProps) {
  const color = getNodeColor(node.type);

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t z-10 transition-all"
      style={{
        background: 'var(--bg-panel)',
        borderColor: 'var(--border-color)',
        maxHeight: '40vh',
      }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          <span className="font-medium text-sm">{node.label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: color + '22', color }}>
            {node.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onExpand(node.id)}
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
            title="Expand connections">
            <Expand className="w-4 h-4" />
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(40vh - 50px)' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(node.metadata).map(([key, value]) => (
            <div key={key} className="p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
              <div className="text-xs mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                {formatKey(key)}
              </div>
              <div className="text-sm font-medium truncate" title={formatValue(value)}>
                {formatValue(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
