import { RotateCcw, GitBranch, Eye, EyeOff } from 'lucide-react';
import { ENTITY_COLORS, ENTITY_LABELS } from '../utils/colors';
import type { EntityType } from '../types';

interface TopBarProps {
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
  onReset: () => void;
  nodeCount?: number;
  edgeCount?: number;
  showGranular: boolean;
  onToggleGranular: () => void;
}

const FILTER_TYPES: EntityType[] = [
  'Customer', 'SalesOrder', 'Delivery', 'BillingDocument',
  'JournalEntry', 'Payment', 'Product', 'Plant',
];

export default function TopBar({ activeFilters, onToggleFilter, onReset, showGranular, onToggleGranular }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-5 py-2.5 border-b"
      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>

      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Mapping /</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Order to Cash</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer hover:shadow-sm active:scale-[0.97]"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          <RotateCcw className="w-3 h-3" />
          Minimize
        </button>

        <button
          onClick={onToggleGranular}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer active:scale-[0.97]"
          style={{
            background: showGranular ? 'var(--accent)' : 'var(--accent-bg)',
            color: showGranular ? '#fff' : 'var(--accent)',
            border: showGranular ? '1px solid var(--accent)' : '1px solid transparent',
          }}
        >
          {showGranular ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showGranular ? 'Hide' : 'Show'} Granular Overlay
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-color)' }} />

        {FILTER_TYPES.map(type => {
          const isActive = activeFilters.has(type);
          const color = ENTITY_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => onToggleFilter(type)}
              className="px-2 py-1 text-[10px] font-medium rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1 active:scale-[0.97]"
              style={{
                background: isActive ? color + '15' : 'transparent',
                color: isActive ? color : 'var(--text-muted)',
                border: `1px solid ${isActive ? color + '30' : 'transparent'}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              {ENTITY_LABELS[type]}
            </button>
          );
        })}
      </div>
    </header>
  );
}
