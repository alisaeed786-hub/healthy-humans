'use client'
import { STATUS_OPTIONS, COLORS } from '@/lib/dashboard/constants'
import type { FilterState } from '@/lib/dashboard/types'

const CHEVRON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"

const selectStyle: React.CSSProperties = {
  padding: '9px 30px 9px 12px', border: '1px solid #e2e8f0',
  borderRadius: 9, fontFamily: 'inherit', fontSize: 13, color: '#334155',
  background: `#fff url("${CHEVRON}") no-repeat right 10px center`,
  cursor: 'pointer', outline: 'none',
}

export default function FilterBar({ filters, sprintOptions, onFiltersChange }: {
  filters: FilterState
  sprintOptions: { value: string; label: string }[]
  onFiltersChange: (f: Partial<FilterState>) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '13px 28px', background: '#fff',
      borderBottom: `1px solid ${COLORS.borderSoft}`, flexShrink: 0,
    }}>
      <select value={filters.sprint}
        onChange={e => onFiltersChange({ sprint: e.target.value })}
        style={selectStyle}>
        {sprintOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
        <span style={{
          position: 'absolute', left: 11, top: '50%',
          transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input value={filters.search}
          onChange={e => onFiltersChange({ search: e.target.value })}
          placeholder="Search tickets…"
          style={{
            width: '100%', padding: '9px 12px 9px 34px',
            border: '1px solid #e2e8f0', borderRadius: 9,
            fontFamily: 'inherit', fontSize: 13, color: COLORS.text,
            outline: 'none', background: '#fff',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#a5b4fc')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        />
      </div>

      <select value={filters.status}
        onChange={e => onFiltersChange({ status: e.target.value })}
        style={selectStyle}>
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
