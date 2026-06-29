'use client'
import { ALL_TICKETS_ID, flattenTickets } from '@/lib/dashboard/selectors'
import { COLORS } from '@/lib/dashboard/constants'
import type { DashboardProject } from '@/lib/dashboard/types'

const SECTIONS = ['My Projects', 'Team Boards'] as const

function NavRow({ active, children, onClick }: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 11,
      padding: '8px 9px', borderRadius: 8, cursor: 'pointer',
      fontSize: 13.5, marginBottom: 1,
      background: active ? COLORS.primarySoft : 'transparent',
      color: active ? COLORS.primary : '#334155',
      fontWeight: active ? 600 : 500,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: COLORS.textFaint,
      padding: '8px 9px 7px', ...style,
    }}>
      {children}
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: color }} />
}

export default function Sidebar({ projects, selectedId, onSelect, onNewProject }: {
  projects: DashboardProject[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewProject: () => void
}) {
  const allCount = flattenTickets(projects).length
  const isAll = selectedId === ALL_TICKETS_ID

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: '#ffffff',
      borderRight: `1px solid ${COLORS.border}`,
      display: 'flex', flexDirection: 'column', height: '100vh',
    }}>
      <div style={{
        padding: '18px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: COLORS.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em',
        }}>P</div>
        <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>ProductProof</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
        <NavRow active={isAll} onClick={() => onSelect(ALL_TICKETS_ID)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="4.5" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
            <rect x="3" y="11.5" width="18" height="4.5" rx="1.4" stroke="currentColor" strokeWidth="1.7" opacity="0.55" />
            <rect x="3" y="19" width="18" height="1.6" rx="0.8" fill="currentColor" opacity="0.3" />
          </svg>
          <span style={{ flex: 1 }}>All Tickets</span>
          <span style={{
            fontSize: 11.5, fontWeight: 600, color: COLORS.textMuted,
            background: '#f1f5f9', padding: '1px 8px', borderRadius: 999,
          }}>{allCount}</span>
        </NavRow>

        {SECTIONS.map((section, i) => (
          <div key={section}>
            <SectionLabel style={i > 0 ? { paddingTop: 18 } : undefined}>{section}</SectionLabel>
            {projects.filter(p => p.section === section).map(p => (
              <NavRow key={p.id} active={p.id === selectedId} onClick={() => onSelect(p.id)}>
                <Dot color={p.dot} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <span style={{
                  fontSize: 11.5, fontWeight: 600, color: COLORS.textMuted,
                  background: '#f1f5f9', padding: '1px 8px', borderRadius: 999,
                }}>{p.tickets.length}</span>
              </NavRow>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9' }}>
        <button onClick={onNewProject} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 7, padding: 9,
          background: COLORS.primarySoft, color: COLORS.primary,
          border: 'none', borderRadius: 9, fontFamily: 'inherit',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span> New Project
        </button>
      </div>
    </aside>
  )
}
