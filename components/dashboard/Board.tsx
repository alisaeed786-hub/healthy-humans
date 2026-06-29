'use client'
import FilterBar from './FilterBar'
import TicketCard from './TicketCard'
import { COLORS, TAB_OPTIONS } from '@/lib/dashboard/constants'
import { boardSubtitle, sprintOptions, filterTickets, filterByTab, tabCounts } from '@/lib/dashboard/selectors'
import type { DashboardTicket, FilterState, TabId, BatchProofState } from '@/lib/dashboard/types'

export default function Board({ title, breadcrumb, tickets, isAll = false,
  filters, onFiltersChange, onOpenTicket, onRunProof,
  selectedKeys, onToggleSelect, onSelectAll, onClearSelect,
  batchProof, activeTab, onTabChange }: {
  title: string
  breadcrumb: string
  tickets: DashboardTicket[]
  isAll?: boolean
  filters: FilterState
  onFiltersChange: (f: Partial<FilterState>) => void
  onOpenTicket: (key: string) => void
  onRunProof: () => void
  selectedKeys: Set<string>
  onToggleSelect: (key: string) => void
  onSelectAll: () => void
  onClearSelect: () => void
  batchProof: BatchProofState
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}) {
  const tabbed = filterByTab(tickets, activeTab)
  const filtered = filterTickets(tabbed, filters)
  const counts = tabCounts(tickets)
  const subtitle = boardSubtitle(tickets)
  const sprints = sprintOptions(tickets)
  const isBatchRunning = batchProof.total > 0

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '22px 28px 0', background: '#fff',
        borderBottom: `1px solid ${COLORS.borderSoft}`, flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, color: COLORS.textFaint, fontWeight: 500, marginBottom: 7 }}>{breadcrumb}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.text }}>
              {title}
            </h1>
            <div style={{ marginTop: 6, fontSize: 13, color: COLORS.textMuted }}>{subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {selectedKeys.size > 0 && (
              <>
                <button onClick={onClearSelect} style={{
                  padding: '9px 14px', background: '#fff', color: '#334155',
                  border: '1px solid #e2e8f0', borderRadius: 9, fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Clear ({selectedKeys.size})</button>
                <button onClick={onRunProof} disabled={isBatchRunning} style={{
                  padding: '9px 16px', background: isBatchRunning ? '#818cf8' : COLORS.primary,
                  color: '#fff', border: 'none', borderRadius: 9, fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 600, cursor: isBatchRunning ? 'not-allowed' : 'pointer',
                }}>
                  {isBatchRunning
                    ? `Proofing ${batchProof.done} of ${batchProof.total}...`
                    : `Run proof (${selectedKeys.size})`}
                </button>
              </>
            )}
            {selectedKeys.size === 0 && (
              <button onClick={onSelectAll} style={{
                padding: '9px 16px', background: COLORS.primarySoft, color: COLORS.primary,
                border: 'none', borderRadius: 9, fontFamily: 'inherit',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Select all</button>
            )}
          </div>
        </div>

        {isBatchRunning && (
          <div style={{ marginBottom: 16, background: '#eef2ff', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: COLORS.primary, fontWeight: 500 }}>
              <span>Proofing {batchProof.done} of {batchProof.total} tickets...</span>
              <span style={{ cursor: 'pointer', color: COLORS.textMuted }} onClick={() => {}}>Cancel</span>
            </div>
            <div style={{ height: 6, background: '#c7d2fe', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999, background: COLORS.primary,
                width: `${(batchProof.done / batchProof.total) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          {TAB_OPTIONS.map(tab => (
            <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              color: activeTab === tab.id ? COLORS.primary : COLORS.textMuted,
              fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer', marginBottom: -1,
            }}>
              {tab.label}
              <span style={{
                marginLeft: 6, fontSize: 11.5, fontWeight: 600,
                color: activeTab === tab.id ? COLORS.primary : COLORS.textFaint,
                background: activeTab === tab.id ? COLORS.primarySoft : '#f1f5f9',
                padding: '1px 7px', borderRadius: 999,
              }}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </header>

      <FilterBar filters={filters} sprintOptions={sprints} onFiltersChange={onFiltersChange} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, maxWidth: 760 }}>
          {filtered.map(t => (
            <TicketCard key={t.key} ticket={t}
              showProject={isAll}
              showProofScores
              selected={selectedKeys.has(t.key)}
              queued={batchProof.queue.some(q => q.key === t.key)}
              analyzing={batchProof.currentlyProofing === t.key}
              onOpen={onOpenTicket}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ maxWidth: 760, textAlign: 'center', padding: '48px 20px', color: '#94a3b8', fontSize: 14 }}>
            No tickets match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
