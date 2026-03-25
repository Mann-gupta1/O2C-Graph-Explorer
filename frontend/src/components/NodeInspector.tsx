import { X } from 'lucide-react';
import { useRef, useEffect } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);
  const entries = Object.entries(node.metadata);
  const visibleEntries = entries.slice(0, 12);
  const hiddenCount = entries.length - visibleEntries.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const tooltipWidth = 320;
  const tooltipHeight = 350;

  let left = 20;
  let top = 60;

  if (position) {
    const graphAreaWidth = window.innerWidth - 380;

    left = position.x + 15;
    top = position.y - 80;

    if (left + tooltipWidth > graphAreaWidth) {
      left = position.x - tooltipWidth - 15;
    }
    if (left < 10) left = 10;

    if (top + tooltipHeight > window.innerHeight - 20) {
      top = window.innerHeight - tooltipHeight - 20;
    }
    if (top < 50) top = 50;
  }

  return (
    <div
      ref={ref}
      className="rounded-xl border animate-scale-in"
      style={{
        position: 'absolute',
        left,
        top,
        width: tooltipWidth,
        zIndex: 50,
        background: '#ffffff',
        borderColor: '#e5e7eb',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#e5e7eb' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
            {node.type.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>
            Entity: {node.type}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ color: '#9ca3af' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-1.5 max-h-[250px] overflow-y-auto">
        {visibleEntries.map(([key, value]) => {
          const val = formatValue(value);
          if (!val) return null;
          return (
            <div key={key} className="flex justify-between gap-3">
              <span className="text-[12px] font-medium shrink-0" style={{ color: '#6b7280' }}>
                {formatKey(key)}:
              </span>
              <span className="text-[12px] text-right truncate" style={{ color: '#111827' }} title={val}>
                {val}
              </span>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <p className="text-[11px] italic pt-1" style={{ color: '#9ca3af' }}>
            Additional fields hidden for readability
          </p>
        )}
      </div>

      <div className="px-4 py-2.5 border-t flex items-center justify-between"
        style={{ borderColor: '#e5e7eb' }}>
        <span className="text-[11px] font-medium" style={{ color: '#6b7280' }}>
          ID: {node.id}
        </span>
        <button
          onClick={() => onExpand(node.id)}
          className="text-[11px] font-medium cursor-pointer transition-colors hover:underline"
          style={{ color: '#4f46e5' }}
        >
          Expand connections
        </button>
      </div>
    </div>
  );
}
