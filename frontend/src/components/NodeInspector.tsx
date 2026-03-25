import { X } from 'lucide-react';
import type { GraphNode } from '../types';

interface NodeInspectorProps {
  node: GraphNode;
  onClose: () => void;
  onExpand: (nodeId: string) => void;
  position?: { x: number; y: number };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
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

export default function NodeInspector({ node, onClose, onExpand, position }: NodeInspectorProps) {
  const entries = Object.entries(node.metadata);
  const visibleEntries = entries.slice(0, 10);
  const hiddenCount = entries.length - visibleEntries.length;

  const style: React.CSSProperties = position
    ? {
        position: 'absolute',
        left: Math.min(position.x + 15, window.innerWidth - 360),
        top: Math.max(position.y - 100, 10),
        zIndex: 50,
      }
    : {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      };

  return (
    <div
      className="w-[320px] rounded-xl border animate-scale-in"
      style={{
        ...style,
        background: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-tooltip)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {node.type.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Entity: {node.type}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {visibleEntries.map(([key, value]) => {
          const val = formatValue(value);
          if (!val) return null;
          return (
            <div key={key} className="flex justify-between gap-3">
              <span className="text-[12px] font-medium shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {formatKey(key)}:
              </span>
              <span className="text-[12px] text-right truncate" style={{ color: 'var(--text-primary)' }} title={val}>
                {val}
              </span>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <p className="text-[11px] italic pt-1" style={{ color: 'var(--text-muted)' }}>
            Additional fields hidden for readability
          </p>
        )}
      </div>

      <div className="px-4 py-2.5 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          Connections: {String(node.metadata._connectionCount ?? '—')}
        </span>
        <button
          onClick={() => onExpand(node.id)}
          className="text-[11px] font-medium cursor-pointer transition-colors hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Expand
        </button>
      </div>
    </div>
  );
}
