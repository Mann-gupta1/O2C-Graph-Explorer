import { X, Maximize2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { GraphNode } from '../types';
import { getNodeColor } from '../utils/colors';

interface NodeInspectorProps {
  node: GraphNode;
  onClose: () => void;
  onExpand: (nodeId: string) => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
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

function MetadataCard({ label, value, color }: { label: string; value: string; color: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="group p-2.5 rounded-lg transition-all duration-200 cursor-pointer relative"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
      onClick={handleCopy}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '30'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="text-[13px] font-medium truncate pr-5" title={value} style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied
          ? <Check className="w-3 h-3 text-emerald-400" />
          : <Copy className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
        }
      </div>
    </div>
  );
}

export default function NodeInspector({ node, onClose, onExpand }: NodeInspectorProps) {
  const color = getNodeColor(node.type);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 animate-slide-up glass"
      style={{ maxHeight: '38vh' }}>

      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{
            background: color,
            boxShadow: `0 0 8px ${color}50`,
          }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {node.label}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md"
            style={{ background: color + '15', color, border: `1px solid ${color}25` }}>
            {node.type}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
            {node.id}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onExpand(node.id)}
            className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/5 active:scale-90"
            style={{ color: 'var(--text-secondary)' }}
            title="Expand connections">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/5 active:scale-90"
            style={{ color: 'var(--text-secondary)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(38vh - 52px)' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(node.metadata).map(([key, value]) => (
            <MetadataCard
              key={key}
              label={formatKey(key)}
              value={formatValue(value)}
              color={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
