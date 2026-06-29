'use client'
import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { STATUS_META, COLORS } from '@/lib/dashboard/constants'
import { proofText } from '@/lib/dashboard/selectors'
import type { DashboardTicket } from '@/lib/dashboard/types'

export default function TicketCard({ ticket, showProject = false, showProofScores = true,
  selected = false, queued = false, analyzing = false,
  onOpen, onToggleSelect }: {
  ticket: DashboardTicket
  showProject?: boolean
  showProofScores?: boolean
  selected?: boolean
  queued?: boolean
  analyzing?: boolean
  onOpen: (key: string) => void
  onToggleSelect?: (key: string) => void
}) {
  const [hover, setHover] = useState(false)
  const m = STATUS_META[ticket.status]
  const dotSep = <span style={{ color: '#cbd5e1' }}>·</span>

  const borderColor = analyzing ? '#6366f1'
    : selected ? '#a5b4fc'
    : hover ? '#c7d2fe'
    : '#e8edf3'

  const boxShadow = analyzing
    ? '0 0 0 2px #e0e7ff'
    : hover ? '0 6px 18px rgba(15,23,42,0.07)' : 'none'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: selected ? '#fafafe' : '#fff',
        border: `1px solid ${borderColor}`,
        borderRadius: 12, padding: '15px 17px', cursor: 'pointer',
        display: 'flex', gap: 12,
        transition: 'border-color .15s, box-shadow .15s, transform .15s',
        boxShadow,
        transform: hover && !analyzing ? 'translateY(-1px)' : 'none',
        animation: analyzing ? 'ppfade 0.5s ease infinite alternate' : 'none',
      }}
    >
      {onToggleSelect && (
        <div
          onClick={e => { e.stopPropagation(); onToggleSelect(ticket.key) }}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
            border: `2px solid ${selected ? COLORS.primary : '#cbd5e1'}`,
            background: selected ? COLORS.primary : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {selected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onOpen(ticket.key)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 9 }}>
          <span style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.01em',
          }}>
            {ticket.key}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {analyzing && (
              <span style={{ fontSize: 11.5, color: COLORS.primary, fontWeight: 500 }}>
                Analyzing...
              </span>
            )}
            {queued && !analyzing && (
              <span style={{ fontSize: 11.5, color: COLORS.textFaint, fontWeight: 500 }}>
                Queued
              </span>
            )}
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div style={{
          fontSize: 14.5, lineHeight: 1.5, color: '#1e293b', fontWeight: 500,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 9,
        }}>
          {ticket.summary}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, color: '#94a3b8' }}>
          {showProject && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, color: '#475569' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ticket.projectDot }} />
                {ticket.projectName}
              </span>
              {dotSep}
            </>
          )}
          <span>{ticket.sprint}</span>
          {showProofScores && (
            <>
              {dotSep}
              <span style={{ color: m.proofColor, fontWeight: 500 }}>{proofText(ticket)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
