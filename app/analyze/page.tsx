'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { COLORS } from '@/lib/dashboard/constants'
import type { DashboardTicket, TicketOverride, ProofStatus } from '@/lib/dashboard/types'

interface VerifiedItem { claim: string; source: string; quote: string }
interface AssumedItem { claim: string; reason: string; pmAction: string }
interface RefinedTicket {
  summary: string
  description: string
  acceptanceCriteria: string[]
  outOfScope: string[]
  assumptions: string[]
}
interface AgentResult {
  status: 'ready' | 'caution' | 'not_ready'
  verifiedCount: number
  assumedCount: number
  verified: VerifiedItem[]
  assumed: AssumedItem[]
  structuralIssues: string[]
  refinedTicket: RefinedTicket
  confluencePageTitles: string[]
  escalationMessage?: string
  error?: string
}
interface EditedTicket {
  summary: string
  description: string
  acceptanceCriteria: string[]
  outOfScope: string[]
  assumptions: string[]
  pmNotes: string
}

function mapHhStatus(hhStatus: string | null | undefined): ProofStatus {
  if (hhStatus === 'ready') return 'ready'
  if (hhStatus === 'caution') return 'caution'
  if (hhStatus === 'not_ready') return 'not_ready'
  return 'not_proofed'
}

function EditableList({ items, onChange, placeholder }: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <input
            value={item}
            onChange={e => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
            placeholder={placeholder}
            style={{
              flex: 1, padding: '8px 10px', border: `1px solid ${COLORS.border}`,
              borderRadius: 7, fontFamily: 'inherit', fontSize: 13,
              color: COLORS.text, outline: 'none', background: '#fff',
            }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            style={{
              padding: '0 10px', background: 'none', border: `1px solid ${COLORS.border}`,
              borderRadius: 7, color: COLORS.textFaint, cursor: 'pointer',
              fontSize: 16, fontFamily: 'inherit',
            }}
          >×</button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        style={{
          alignSelf: 'flex-start', padding: '6px 12px',
          background: COLORS.primarySoft, color: COLORS.primary,
          border: 'none', borderRadius: 7, fontFamily: 'inherit',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}
      >+ Add</button>
    </div>
  )
}

export default function AnalyzePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticketKey = (searchParams.get('ticket') ?? '').toUpperCase()

  const [sidebarTickets, setSidebarTickets] = useState<DashboardTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AgentResult | null>(null)
  const [editedTicket, setEditedTicket] = useState<EditedTicket | null>(null)
  const [pushing, setPushing] = useState(false)
  const [pushSuccess, setPushSuccess] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [ticketOverrides, setTicketOverrides] = useState<Record<string, TicketOverride>>({})

  useEffect(() => {
    fetch('/api/tickets')
      .then(r => r.json())
      .then((data: { tickets?: Record<string, unknown>[] }) => {
        const raw = data.tickets ?? []
        const filtered = raw.filter(t => t.type !== 'Epic' && t.type !== 'Subtask')
        setSidebarTickets(filtered.map(t => ({
          key: t.key as string,
          summary: (t.summary as string) ?? '',
          status: mapHhStatus(t.hhStatus as string | null),
          sprint: (t.sprint as string) ?? 'No sprint',
          checks: [],
          projectId: ((t.key as string).split('-')[0] ?? '').toLowerCase(),
          projectName: 'Healthy Humans',
          projectDot: '#059669',
          hhAssumedCount: (t.hhAssumedCount as number) ?? null,
          hhVerifiedCount: (t.hhVerifiedCount as number) ?? null,
          hhKeywords: (t.hhKeywords as string) ?? null,
          hhConfluencePages: (t.hhConfluencePages as string) ?? null,
        })))
      })
      .catch(() => {})
  }, [])

  const runAnalysis = useCallback(async (key: string) => {
    if (!key) return
    setLoading(true)
    setAnalysis(null)
    setEditedTicket(null)
    setPushSuccess(false)
    setPushError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketKey: key }),
      })
      const data = await res.json()
      if (res.ok && data.analysis) {
        const a = data.analysis as AgentResult
        setAnalysis(a)
        setEditedTicket({
          summary: a.refinedTicket.summary,
          description: a.refinedTicket.description,
          acceptanceCriteria: [...a.refinedTicket.acceptanceCriteria],
          outOfScope: [...a.refinedTicket.outOfScope],
          assumptions: [...a.refinedTicket.assumptions],
          pmNotes: '',
        })
        setTicketOverrides(prev => ({
          ...prev,
          [key]: {
            status: a.status,
            hhAssumedCount: a.assumedCount,
            hhVerifiedCount: a.verifiedCount,
            hhKeywords: a.confluencePageTitles?.join(', ') || null,
            hhConfluencePages: a.confluencePageTitles?.join(', ') || null,
          },
        }))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ticketKey) runAnalysis(ticketKey)
  }, [ticketKey, runAnalysis])

  async function handlePushToJira() {
    if (!editedTicket || !ticketKey) return
    setPushing(true)
    setPushError(null)
    try {
      const res = await fetch('/api/push-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketKey,
          ...editedTicket,
          hhPmNotes: editedTicket.pmNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Push failed')
      setPushSuccess(true)
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Push failed')
    } finally {
      setPushing(false)
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%', padding: '9px 11px', border: `1px solid ${COLORS.border}`,
    borderRadius: 8, fontFamily: 'inherit', fontSize: 13.5, color: COLORS.text,
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  }

  const fieldLabel: CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    color: COLORS.textFaint, marginBottom: 8,
  }

  const cardBorder = (accentColor: string): CSSProperties => ({
    background: '#fff',
    borderTop: `1px solid ${COLORS.borderSoft}`,
    borderRight: `1px solid ${COLORS.borderSoft}`,
    borderBottom: `1px solid ${COLORS.borderSoft}`,
    borderLeft: `4px solid ${accentColor}`,
    borderRadius: 12, padding: '16px 20px', marginBottom: 16,
  })

  const sectionTitle = (color: string): CSSProperties => ({
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.06em', color, marginBottom: 12,
  })

  const projectName = sidebarTickets[0]?.projectName ?? 'Healthy Humans'

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      background: COLORS.background, color: COLORS.text, overflow: 'hidden',
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, background: '#fff',
        borderRight: `1px solid ${COLORS.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh',
      }}>
        {/* Logo */}
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

        {/* Back button */}
        <div style={{ padding: '10px 10px 2px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '7px 9px', background: 'none', border: 'none', borderRadius: 7,
              cursor: 'pointer', fontSize: 13, color: COLORS.textMuted,
              fontFamily: 'inherit', fontWeight: 500,
            }}
          >
            ← Dashboard
          </button>
        </div>

        {/* Project label */}
        <div style={{
          padding: '10px 19px 4px', fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textFaint,
        }}>
          {projectName}
        </div>

        {/* Ticket list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 14px' }}>
          {sidebarTickets.map(t => {
            const effectiveStatus = ticketOverrides[t.key]?.status ?? t.status
            const isActive = t.key === ticketKey
            return (
              <div
                key={t.key}
                onClick={() => router.push(`/analyze?ticket=${t.key}`)}
                style={{
                  padding: '9px 10px 9px 7px', borderRadius: 8, cursor: 'pointer',
                  marginBottom: 2,
                  background: isActive ? '#eef2ff' : 'transparent',
                  borderLeft: isActive ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 6, marginBottom: 3,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: 11.5, fontWeight: 700,
                    color: isActive ? COLORS.primary : '#475569',
                  }}>{t.key}</span>
                  <StatusBadge status={effectiveStatus} />
                </div>
                <div style={{
                  fontSize: 12, color: '#334155', lineHeight: 1.35,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.summary}
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' }}>

        {/* No ticket selected */}
        {!ticketKey && (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: COLORS.textMuted, fontSize: 14,
          }}>
            Select a ticket from the sidebar
          </div>
        )}

        {/* Loading */}
        {ticketKey && loading && (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', gap: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `3px solid ${COLORS.primarySoft}`,
              borderTopColor: COLORS.primary,
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ fontSize: 14, color: COLORS.textMuted }}>
              Analyzing {ticketKey}...
            </div>
          </div>
        )}

        {/* Results */}
        {ticketKey && !loading && analysis && editedTicket && (
          <div style={{ padding: '28px 36px 60px', animation: 'ppfade 0.3s ease', maxWidth: 820 }}>

            {/* 1. Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <span style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 20, fontWeight: 700, color: COLORS.text,
              }}>{ticketKey}</span>
              <StatusBadge status={analysis.status} />
            </div>

            {/* 2. Readiness summary */}
            <div style={{
              background: '#fff', border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: '18px 20px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <StatusBadge status={analysis.status} />
                <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
                  ✓ {analysis.verifiedCount} verified
                </span>
                <span style={{ fontSize: 13, color: '#D97706', fontWeight: 600 }}>
                  ≈ {analysis.assumedCount} assumed
                </span>
                {analysis.confluencePageTitles.length > 0 && (
                  <span style={{ fontSize: 12, color: COLORS.textFaint }}>
                    Sources: {analysis.confluencePageTitles.join(', ')}
                  </span>
                )}
              </div>
              {analysis.escalationMessage && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 8, fontSize: 13, color: '#92400e',
                }}>
                  {analysis.escalationMessage}
                </div>
              )}
            </div>

            {/* 3. Structural issues */}
            {analysis.structuralIssues.length > 0 && (
              <div style={cardBorder('#E11D48')}>
                <div style={sectionTitle('#be123c')}>
                  Structural Issues ({analysis.structuralIssues.length})
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {analysis.structuralIssues.map((issue, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: '#334155' }}>
                      <span style={{ color: '#E11D48', flexShrink: 0 }}>•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Verified */}
            <div style={cardBorder('#059669')}>
              <div style={sectionTitle('#047857')}>
                Verified ({analysis.verifiedCount})
              </div>
              {analysis.verified.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13.5, color: COLORS.textMuted }}>
                  No claims verified — Confluence pages may not cover this ticket
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {analysis.verified.map((v, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>
                        {v.claim}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 3 }}>{v.source}</div>
                      <div style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b' }}>"{v.quote}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Assumed */}
            <div style={cardBorder('#D97706')}>
              <div style={sectionTitle('#b45309')}>
                Assumed ({analysis.assumedCount}) — review before presenting
              </div>
              {analysis.assumed.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13.5, color: COLORS.textMuted }}>
                  No assumptions — all claims verified
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {analysis.assumed.map((a, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>
                        {a.claim}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 3 }}>{a.reason}</div>
                      <div style={{ fontSize: 12, color: '#D97706' }}>→ {a.pmAction}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Refined ticket (editable) */}
            <div style={{
              background: '#fff', border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: '20px 24px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>
                Refined Ticket
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={fieldLabel}>Summary</label>
                  <input
                    value={editedTicket.summary}
                    onChange={e => setEditedTicket(p => p ? { ...p, summary: e.target.value } : p)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Description</label>
                  <textarea
                    value={editedTicket.description}
                    onChange={e => setEditedTicket(p => p ? { ...p, description: e.target.value } : p)}
                    rows={6}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Acceptance Criteria</label>
                  <EditableList
                    items={editedTicket.acceptanceCriteria}
                    onChange={items => setEditedTicket(p => p ? { ...p, acceptanceCriteria: items } : p)}
                    placeholder="Acceptance criterion..."
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Out of Scope</label>
                  <EditableList
                    items={editedTicket.outOfScope}
                    onChange={items => setEditedTicket(p => p ? { ...p, outOfScope: items } : p)}
                    placeholder="Out of scope item..."
                  />
                </div>

                <div>
                  <label style={fieldLabel}>Assumptions</label>
                  <EditableList
                    items={editedTicket.assumptions}
                    onChange={items => setEditedTicket(p => p ? { ...p, assumptions: items } : p)}
                    placeholder="Assumption..."
                  />
                </div>

                <div>
                  <label style={fieldLabel}>PM Notes</label>
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: COLORS.textMuted }}>
                    Add any additional context, decisions, or follow-up actions
                  </p>
                  <textarea
                    value={editedTicket.pmNotes}
                    onChange={e => setEditedTicket(p => p ? { ...p, pmNotes: e.target.value } : p)}
                    rows={4}
                    placeholder="e.g. Discussed with team on 2026-06-27, decided to defer edge case X..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* 7. Approve & Push to Jira */}
            {pushSuccess ? (
              <div style={{
                padding: '14px 20px', background: '#ecfdf5',
                border: '1px solid #6ee7b7', borderRadius: 12,
                fontSize: 14, color: '#065f46', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                ✓ Pushed to Jira successfully.{' '}
                <a
                  href={`https://healthyhumans.atlassian.net/browse/${ticketKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: COLORS.primary, textDecoration: 'underline' }}
                >
                  View {ticketKey} in Jira
                </a>
              </div>
            ) : (
              <div>
                {pushError && (
                  <div style={{
                    marginBottom: 10, padding: '10px 14px',
                    background: '#fff1f2', border: '1px solid #fecdd3',
                    borderRadius: 8, fontSize: 13, color: '#be123c',
                  }}>
                    {pushError}
                  </div>
                )}
                <button
                  onClick={handlePushToJira}
                  disabled={pushing}
                  style={{
                    width: '100%', padding: '13px',
                    background: pushing ? '#6ee7b7' : '#059669',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                    cursor: pushing ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {pushing ? 'Pushing to Jira...' : 'Approve & Push to Jira'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
