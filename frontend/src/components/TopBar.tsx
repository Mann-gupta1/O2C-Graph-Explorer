import { RotateCcw, Hexagon, Network } from 'lucide-react';
import { ENTITY_COLORS, ENTITY_LABELS } from '../utils/colors';
import type { EntityType } from '../types';

interface TopBarProps {
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
  onReset: () => void;
  nodeCount?: number;
  edgeCount?: number;
}

const FILTER_TYPES: EntityType[] = [
  'Customer', 'SalesOrder', 'Delivery', 'BillingDocument',
  'JournalEntry', 'Payment', 'Product', 'Plant',
];

export default function TopBar({ activeFilters, onToggleFilter, onReset, nodeCount, edgeCount }: TopBarProps) {
  return (
    <header className="glass flex items-center justify-between px-5 py-2.5 z-20 relative">
      <div className="flex items-center gap-3.5">
        <div className="relative w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'var(--gradient-1)' }}>
          <Hexagon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            O2C Graph Explorer
          </h1>
          {(nodeCount !== undefined || edgeCount !== undefined) && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Network className="w-3 h-3" />
                {nodeCount} nodes &middot; {edgeCount} edges
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_TYPES.map(type => {
          const isActive = activeFilters.has(type);
          const color = ENTITY_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => onToggleFilter(type)}
              className="group px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              style={{
                background: isActive ? color + '18' : 'transparent',
                border: `1px solid ${isActive ? color + '40' : 'transparent'}`,
                color: isActive ? color : 'var(--text-secondary)',
                boxShadow: isActive ? `0 0 12px ${color}15` : 'none',
              }}
            >
              <span className="w-2 h-2 rounded-full transition-transform duration-200"
                style={{
                  background: color,
                  boxShadow: isActive ? `0 0 6px ${color}60` : 'none',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                }} />
              {ENTITY_LABELS[type]}
            </button>
          );
        })}

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-color)' }} />

        <button
          onClick={onReset}
          className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/5 active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
          title="Reset graph"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
