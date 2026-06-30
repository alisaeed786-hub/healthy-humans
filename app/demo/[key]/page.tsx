'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

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

type TabKey = 'refined' | 'verified' | 'assumed' | 'issues'

const COLORS = {
  background: '#15171D',
  card: '#1C1F27',
  border: 'rgba(255,255,255,0.08)',
  primary: '#8B9EFF',
  verified: '#6FD6A8',
  assumed: '#F2B66D',
  issues: '#E89B6F',
  text: '#F2EEE7',
  muted: '#C9C3B6',
}

const STATUS_META: Record<AgentResult['status'], { label: string; color: string }> = {
  ready: { label: 'Ready', color: COLORS.verified },
  caution: { label: 'Caution', color: COLORS.assumed },
  not_ready: { label: 'Not ready', color: COLORS.issues },
}

function StatusBadge({ status }: { status: AgentResult['status'] }) {
  const meta = STATUS_META[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 999,
      background: `${meta.color}18`, border: `1px solid ${meta.color}40`,
      color: meta.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      {meta.label}
    </span>
  )
}

const tabBaseStyle: CSSProperties = {
  padding: '12px 20px', fontSize: 14, background: 'none', border: 'none',
  borderBottom: '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit',
  fontWeight: 600,
}

export default function DemoTicketPage() {
  const params = useParams()
  const router = useRouter()
  const ticketKey = String(params.key ?? '').toUpperCase()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AgentResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('refined')

  const [pushState, setPushState] = useState<'idle' | 'pushing' | 'success'>('idle')

  useEffect(() => {
    if (!ticketKey) return
    setLoading(true)
    setError(null)
    setAnalysis(null)
    setActiveTab('refined')
    setPushState('idle')

    fetch('/api/analyze-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketKey }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load analysis')
        await new Promise(resolve => setTimeout(resolve, 3500))
        setAnalysis(data.analysis as AgentResult)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load analysis'))
      .finally(() => setLoading(false))
  }, [ticketKey])

  async function handlePush() {
    setPushState('pushing')
    await new Promise(resolve => setTimeout(resolve, 2500))
    setPushState('success')
  }

  const tabs: { key: TabKey; label: string }[] = analysis ? [
    { key: 'refined', label: 'Refined Ticket' },
    { key: 'verified', label: `Verified (${analysis.verifiedCount})` },
    { key: 'assumed', label: `Assumed (${analysis.assumedCount})` },
    ...(analysis.structuralIssues.length > 0
      ? [{ key: 'issues' as TabKey, label: `Issues (${analysis.structuralIssues.length})` }]
      : []),
  ] : []

  function fieldLabel(text: string) {
    return (
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: COLORS.muted, marginBottom: 8,
      }}>{text}</div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%', background: COLORS.background,
      color: COLORS.text, fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      <div style={{ padding: '20px 36px 0' }}>
        <button
          onClick={() => router.push('/demo')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 9px', background: 'none', border: 'none', borderRadius: 7,
            cursor: 'pointer', fontSize: 13, color: COLORS.muted,
            fontFamily: 'inherit', fontWeight: 500,
          }}
        >
          ← Back to demo
        </button>
      </div>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '20px 36px 80px' }}>
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16, padding: '120px 0',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `3px solid rgba(139,158,255,0.2)`,
              borderTopColor: COLORS.primary,
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ fontSize: 14, color: COLORS.muted }}>
              Loading analysis...
            </div>
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: '14px 20px', background: 'rgba(232,155,111,0.08)',
            border: `1px solid ${COLORS.issues}40`, borderRadius: 12,
            fontSize: 14, color: COLORS.issues,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && analysis && (
          <div style={{ animation: 'ppfade 0.3s ease' }}>
            {/* Header card */}
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: '20px 24px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
                <span style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: 18, fontWeight: 700, color: COLORS.text,
                }}>{ticketKey}</span>
                <StatusBadge status={analysis.status} />
              </div>

              <div style={{ fontSize: 16, color: COLORS.text, lineHeight: 1.5, marginBottom: 16 }}>
                {analysis.refinedTicket.summary}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: `${COLORS.verified}18`, border: `1px solid ${COLORS.verified}40`,
                  color: COLORS.verified, fontSize: 12, fontWeight: 700,
                }}>
                  ✓ {analysis.verifiedCount} verified
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: `${COLORS.assumed}18`, border: `1px solid ${COLORS.assumed}40`,
                  color: COLORS.assumed, fontSize: 12, fontWeight: 700,
                }}>
                  ≈ {analysis.assumedCount} assumed
                </span>
              </div>

              {analysis.escalationMessage && (
                <div style={{
                  marginTop: 14, padding: '10px 14px',
                  background: 'rgba(139,158,255,0.08)', border: `1px solid ${COLORS.primary}40`,
                  borderRadius: 8, fontSize: 13, color: COLORS.primary,
                }}>
                  {analysis.escalationMessage}
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div style={{
              display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 20,
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    ...tabBaseStyle,
                    color: activeTab === tab.key ? '#F2EEE7' : '#6E7480',
                    borderBottomColor: activeTab === tab.key ? COLORS.primary : 'transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: '22px 24px', marginBottom: 20,
            }}>
              {activeTab === 'refined' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    {fieldLabel('Summary')}
                    <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.6 }}>
                      {analysis.refinedTicket.summary}
                    </div>
                  </div>

                  <div>
                    {fieldLabel('Description')}
                    <div style={{
                      fontSize: 14, color: COLORS.text, lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {analysis.refinedTicket.description}
                    </div>
                  </div>

                  <div>
                    {fieldLabel('Acceptance Criteria')}
                    {analysis.refinedTicket.acceptanceCriteria.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 13.5, color: COLORS.muted }}>None</p>
                    ) : (
                      <>
                        <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {analysis.refinedTicket.acceptanceCriteria.slice(0, 3).map((c, i) => (
                            <li key={i} style={{ fontSize: 13.5, color: COLORS.text }}>{c}</li>
                          ))}
                        </ol>
                        {analysis.refinedTicket.acceptanceCriteria.length > 3 && (
                          <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 6 }}>
                            +{analysis.refinedTicket.acceptanceCriteria.length - 3} more criteria
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {pushState === 'success' ? (
                    <div style={{
                      background: 'rgba(111,214,168,0.08)', border: '1px solid rgba(111,214,168,0.2)',
                      borderRadius: 10, padding: '20px 24px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: COLORS.verified, fontSize: 16 }}>✓</span>
                        <span style={{ color: COLORS.verified, fontWeight: 700, fontSize: 14 }}>Ready to push</span>
                      </div>
                      <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
                        In a live environment this would update {ticketKey} in your connected Jira board
                        with the refined ticket content. This is a demo — no changes were made to your
                        real board.
                      </p>
                      <button
                        onClick={() => router.push('/demo')}
                        style={{
                          padding: '10px 20px', background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.14)', color: COLORS.muted,
                          borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        ← Back to demo
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <button
                        onClick={() => router.push('/demo')}
                        style={{
                          flex: 1, padding: '13px', background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.14)', color: COLORS.muted,
                          borderRadius: 10, fontSize: 14, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        ← Back to demo
                      </button>
                      <button
                        onClick={handlePush}
                        disabled={pushState === 'pushing'}
                        style={{
                          flex: 1, padding: '13px', background: COLORS.verified, color: '#15171D',
                          border: 'none', borderRadius: 10, fontFamily: 'inherit',
                          fontSize: 14, fontWeight: 700,
                          cursor: pushState === 'pushing' ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        {pushState === 'pushing' ? (
                          <>
                            <span style={{
                              width: 14, height: 14, borderRadius: '50%',
                              border: '2px solid rgba(21,23,29,0.3)',
                              borderTopColor: '#15171D',
                              animation: 'spin 0.8s linear infinite',
                              display: 'inline-block',
                            }} />
                            Pushing...
                          </>
                        ) : (
                          'Approve & Push to Jira'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'verified' && (
                analysis.verified.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13.5, color: COLORS.muted }}>
                    No claims verified — Confluence pages may not cover this ticket
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {analysis.verified.map((v, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: COLORS.verified, fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>
                            {v.claim}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 3 }}>{v.source}</div>
                          <div style={{ fontSize: 12, fontStyle: 'italic', color: COLORS.muted }}>&quot;{v.quote}&quot;</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'assumed' && (
                analysis.assumed.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13.5, color: COLORS.muted }}>
                    No assumptions — all claims verified
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {analysis.assumed.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: COLORS.assumed, fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>≈</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>
                            {a.claim}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>{a.reason}</div>
                          <div style={{
                            padding: '8px 12px', background: 'rgba(242,182,109,0.08)',
                            border: `1px solid ${COLORS.assumed}30`, borderRadius: 8,
                            fontSize: 12, color: COLORS.assumed, lineHeight: 1.5,
                          }}>
                            → {a.pmAction}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              {activeTab === 'assumed' && analysis.refinedTicket.outOfScope.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
                  {fieldLabel('Out of Scope')}
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {analysis.refinedTicket.outOfScope.map((c, i) => (
                      <li key={i} style={{ fontSize: 13, color: COLORS.muted }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'issues' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {analysis.structuralIssues.map((issue, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: COLORS.issues,
                        flexShrink: 0, marginTop: 6,
                      }} />
                      <span style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 1.6 }}>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
