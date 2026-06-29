'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from './StatusBadge'
import { CHECK_META, COLORS } from '@/lib/dashboard/constants'
import { proofStats } from '@/lib/dashboard/selectors'
import type { DashboardTicket, TicketOverride } from '@/lib/dashboard/types'

export default function TicketDrawer({ ticket, batchRunning, onClose, onProofComplete }: {
  ticket: DashboardTicket | null
  batchRunning: boolean
  onClose: () => void
  onProofComplete: (key: string, override: TicketOverride) => void
}) {
  const router = useRouter()
  const [proofing, setProofing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!ticket) return null

  const isProofed = ticket.status !== 'not_proofed'
  const { total, verified } = proofStats(ticket)

  async function handleRunProof() {
    setProofing(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketKey: ticket!.key }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      const a = data.analysis
      onProofComplete(ticket!.key, {
        status: a.status,
        hhAssumedCount: a.assumedCount,
        hhVerifiedCount: a.verifiedCount,
        hhKeywords: a.confluencePageTitles?.join(', ') || null,
        hhConfluencePages: a.confluencePageTitles?.join(', ') || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setProofing(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)',
        zIndex: 40, animation: 'ppfade .15s ease',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh',
        width: 440, maxWidth: '92vw', background: '#fff',
        zIndex: 50, boxShadow: '-8px 0 32px rgba(15,23,42,0.12)',
        display: 'flex', flexDirection: 'column',
        animation: 'ppslide .2s ease',
      }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 13, fontWeight: 600, color: '#64748b',
            }}>
              {ticket.key}
            </span>
            <div onClick={onClose} style={{
              cursor: 'pointer', width: 28, height: 28, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', fontSize: 19, lineHeight: 1,
            }}>×</div>
          </div>
          <div style={{ marginTop: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={ticket.status} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{ticket.sprint}</span>
          </div>
          <div style={{ marginTop: 15, fontSize: 15.5, lineHeight: 1.55, color: '#1e293b', fontWeight: 500 }}>
            {ticket.summary}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#be123c' }}>
              {error}
            </div>
          )}

          {ticket.hhAssumedCount !== null ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                  Proof summary
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, background: '#ecfdf5', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{ticket.hhVerifiedCount ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Verified</div>
                </div>
                <div style={{ flex: 1, background: '#fffbeb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706' }}>{ticket.hhAssumedCount ?? 0}</div>
                  <div style={{ fontSize: 12, color: '#D97706', marginTop: 4 }}>Assumed</div>
                </div>
              </div>
              {ticket.hhKeywords && (
                <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Keywords: </span>
                  {ticket.hhKeywords}
                </div>
              )}
              {ticket.hhConfluencePages && (
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Sources: </span>
                  {ticket.hhConfluencePages}
                </div>
              )}
            </div>
          ) : isProofed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                  Proof report
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{`${verified} of ${total} verified`}</span>
              </div>
              {ticket.checks.map(([label, verdict]) => {
                const cm = CHECK_META[verdict]
                return (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 13px', border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                      color: cm.color, background: cm.bg,
                    }}>{cm.symbol}</span>
                    <span style={{ flex: 1, fontSize: 13.5, color: '#334155' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: cm.color }}>{cm.note}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 18 }}>
                This ticket has not been proofed yet. Run a proof to check it against your
                documentation, acceptance criteria, and edge cases.
              </div>
              {batchRunning ? (
                <div style={{ fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' }}>
                  Batch proof in progress — please wait
                </div>
              ) : (
                <button onClick={handleRunProof} disabled={proofing} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', background: proofing ? '#818cf8' : COLORS.primary,
                  color: '#fff', border: 'none', borderRadius: 9,
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  cursor: proofing ? 'not-allowed' : 'pointer',
                }}>
                  {proofing ? 'Analyzing...' : 'Run proof'}
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${COLORS.borderSoft}`, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 10, background: '#fff', color: '#334155',
            border: '1px solid #e2e8f0', borderRadius: 9, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Close</button>
          <button onClick={() => router.push(`/analyze?ticket=${ticket.key}`)} style={{
            flex: 1, padding: 10, background: COLORS.primary, color: '#fff',
            border: 'none', borderRadius: 9, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Open full analysis</button>
        </div>
      </div>
    </>
  )
}
