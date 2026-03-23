import { RotateCcw, GitBranch } from 'lucide-react';
import { ENTITY_COLORS, ENTITY_LABELS } from '../utils/colors';
import type { EntityType } from '../types';

interface TopBarProps {
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
  onReset: () => void;
}

const FILTER_TYPES: EntityType[] = [
  'Customer', 'SalesOrder', 'Delivery', 'BillingDocument',
  'JournalEntry', 'Payment', 'Product', 'Plant',
];

export default function TopBar({ activeFilters, onToggleFilter, onReset }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-3">
        <GitBranch className="w-6 h-6" style={{ color: 'var(--accent)' }} />
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          SAP O2C Graph Explorer
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_TYPES.map(type => {
          const isActive = activeFilters.has(type);
          const color = ENTITY_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => onToggleFilter(type)}
              className="px-2.5 py-1 text-xs rounded-full border transition-all duration-200 cursor-pointer"
              style={{
                background: isActive ? color + '22' : 'transparent',
                borderColor: isActive ? color : 'var(--border-color)',
                color: isActive ? color : 'var(--text-secondary)',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ background: color }} />
              {ENTITY_LABELS[type]}
            </button>
          );
        })}
        <button
          onClick={onReset}
          className="ml-2 p-1.5 rounded-lg border transition-colors cursor-pointer"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title="Reset graph"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
