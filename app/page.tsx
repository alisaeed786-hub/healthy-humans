'use client'

import { useState, useEffect, useCallback } from 'react'
import DiffView from '@/components/DiffView'

interface RecentTicket {
  key: string
  summary: string
  status: string
  type: string
  priority: string
}

interface ConfluencePage {
  id: string
  title: string
  url: string
  space: string
  excerpt: string
}

interface VerifiedItem {
  claim: string
  source: string
  quote: string
}

interface AssumedItem {
  claim: string
  reason: string
  pmAction: string
}

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
  diff: {
    summary: { original: string, revised: string }
    description: { original: string, revised: string }
    acceptanceCriteria: { original: string, revised: string }
  }
  confluenceLinks: string[]
  confluencePageCount: number
  confluencePageTitles: string[]
  escalationMessage?: string
  error?: string
}

interface JiraTicket {
  key: string
  summary: string
  description: string
  issueType: string
  status: string
  priority: string
  acceptanceCriteria: string
  labels: string[]
  components: string[]
  storyPoints: number | null
}

interface AnalyzeResult {
  ticket: JiraTicket
  analysis: AgentResult
  confluencePages: ConfluencePage[]
}

type Tab = 'analysis' | 'diff' | 'refined'

const statusConfig = {
  ready: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: 'Ready to present' },
  caution: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Present with caution' },
  not_ready: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', label: 'Not ready' },
}

const assumedColorClass = {
  ready: 'text-emerald-600',
  caution: 'text-amber-600',
  not_ready: 'text-red-600',
}

export default function Home() {
  const [ticketKey, setTicketKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('analysis')
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [refineLoading, setRefineLoading] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)

  const fetchRecentTickets = useCallback(async () => {
    setLoadingRecent(true)
    try {
      const res = await fetch('/api/tickets')
      if (res.ok) {
        const data = await res.json()
        setRecentTickets(data.tickets ?? [])
      }
    } catch {
      // silently ignore — recent tickets are optional
    } finally {
      setLoadingRecent(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentTickets()
  }, [fetchRecentTickets])

  async function handleAnalyze(key?: string) {
    const targetKey = key ?? ticketKey
    if (!targetKey.trim()) return

    setLoading(true)
    setError(null)
    setRefineError(null)
    setResult(null)
    setActiveTab('analysis')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketKey: targetKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Unknown error')
      } else {
        setResult(data as AnalyzeResult)
        if (key) setTicketKey(key)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefine(key?: string) {
    const targetKey = key ?? ticketKey
    if (!targetKey.trim()) return

    setRefineLoading(true)
    setRefineError(null)
    setError(null)
    setResult(null)
    setActiveTab('analysis')

    try {
      const res = await fetch('/api/agent/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketKey: targetKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        setRefineError(data.error ?? 'Unknown error')
      } else {
        setResult(data as AnalyzeResult)
        if (key) setTicketKey(key)
      }
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setRefineLoading(false)
    }
  }

  const priorityColor: Record<string, string> = {
    Highest: 'text-red-600 bg-red-50',
    High: 'text-orange-600 bg-orange-50',
    Medium: 'text-yellow-600 bg-yellow-50',
    Low: 'text-blue-600 bg-blue-50',
    Lowest: 'text-slate-500 bg-slate-100',
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'analysis', label: 'Pressure Test' },
    { id: 'diff', label: 'Diff View' },
    { id: 'refined', label: 'Refined Ticket' },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              HH
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">
                Healthy Humans
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Jira Ticket Pressure Tester</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-lg ml-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={ticketKey}
                onChange={e => setTicketKey(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="Enter ticket key, e.g. SCRUM-42"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !ticketKey.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  'Analyze'
                )}
              </button>
              <button
                onClick={() => handleRefine()}
                disabled={refineLoading || !ticketKey.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {refineLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Refining...
                  </span>
                ) : (
                  'Refine'
                )}
              </button>
            </div>
          </div>

          <a
            href={`https://healthyhumans.atlassian.net/jira/software/projects/SCRUM/boards`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline hidden sm:block"
          >
            Open Jira
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar — recent tickets */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Recent Tickets
              </span>
              {loadingRecent && (
                <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {recentTickets.length === 0 && !loadingRecent ? (
              <p className="text-xs text-slate-400 px-4 py-3">
                No tickets loaded — check your Jira credentials.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentTickets.map(t => (
                  <li key={t.key}>
                    <button
                      onClick={() => handleAnalyze(t.key)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600">
                          {t.key}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            priorityColor[t.priority] ?? 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 line-clamp-2">
                        {t.summary}
                      </p>
                      <span className="text-xs text-slate-400 mt-1 inline-block">
                        {t.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {refineError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
              <strong>Refine Error:</strong> {refineError}
            </div>
          )}

          {refineLoading && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4 text-center">
              <div className="inline-block w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-600 font-medium text-sm">Running multi-agent analysis...</p>
              <p className="text-slate-400 text-xs mt-1">Structural check, Confluence verification & rewrite</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Fetching ticket & Confluence pages...</p>
              <p className="text-slate-400 text-sm mt-1">Running structural, verification & rewrite agents</p>
            </div>
          )}

          {!result && !loading && !refineLoading && !error && !refineError && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Enter a ticket key to get started
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Healthy Humans fetches your Jira ticket, finds relevant Confluence pages, then runs
                structural, verification, and rewrite agents to flag unverified claims and produce a refined ticket.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Ticket header */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <a
                        href={`https://healthyhumans.atlassian.net/browse/${result.ticket.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono font-bold text-indigo-600 hover:underline"
                      >
                        {result.ticket.key}
                      </a>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{result.ticket.issueType}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{result.ticket.status}</span>
                      {result.ticket.storyPoints !== null && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            {result.ticket.storyPoints} pts
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {result.ticket.summary}
                    </h2>
                    {result.ticket.labels.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {result.ticket.labels.map(l => (
                          <span key={l} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Readiness badge */}
                  <div className={`px-4 py-3 rounded-lg border text-center ${statusConfig[result.analysis.status].bg}`}>
                    <p className={`text-sm font-bold ${statusConfig[result.analysis.status].text}`}>
                      {statusConfig[result.analysis.status].label}
                    </p>
                    <div className="flex gap-3 mt-1.5 justify-center text-xs font-semibold">
                      <span className="text-emerald-600">Verified {result.analysis.verifiedCount}</span>
                      <span className={assumedColorClass[result.analysis.status]}>
                        Assumed {result.analysis.assumedCount}
                      </span>
                    </div>
                  </div>
                </div>

                {result.analysis.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <strong>Error:</strong> {result.analysis.error}
                  </div>
                )}

                {result.analysis.confluencePageCount === 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    No Confluence pages found — all claims are unverified
                  </div>
                )}

                {result.analysis.escalationMessage && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    {result.analysis.escalationMessage}
                  </div>
                )}

                {result.analysis.confluencePageTitles.length > 0 && (
                  <p className="mt-3 text-xs text-slate-400">
                    Context used: {result.analysis.confluencePageTitles.join(', ')}
                  </p>
                )}
              </div>

              {/* Confluence context */}
              {result.confluencePages.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span>📄</span> Confluence Context ({result.confluencePages.length} pages)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.confluencePages.map(page => (
                      <a
                        key={page.id}
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-slate-400 text-sm">📝</span>
                          <div>
                            <p className="text-sm font-medium text-slate-800 line-clamp-1">
                              {page.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{page.space}</p>
                            {page.excerpt && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {page.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {/* Analysis tab */}
                  {activeTab === 'analysis' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Verified */}
                        <div className="rounded-lg border-l-4 border-emerald-400 bg-emerald-50/40 p-4">
                          <h3 className="font-semibold text-sm text-emerald-800 mb-3">
                            Verified ({result.analysis.verifiedCount})
                          </h3>
                          {result.analysis.verified.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              Nothing could be verified against Confluence
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {result.analysis.verified.map((v, i) => (
                                <div key={i} className="text-sm">
                                  <p className="font-bold text-slate-900">{v.claim}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{v.source}</p>
                                  <p className="text-xs italic text-slate-600 mt-1">&ldquo;{v.quote}&rdquo;</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assumed */}
                        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50/40 p-4">
                          <h3 className="font-semibold text-sm text-amber-800 mb-3">
                            Assumed ({result.analysis.assumedCount}) — review before presenting
                          </h3>
                          {result.analysis.assumed.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No assumptions — all claims verified
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {result.analysis.assumed.map((a, i) => (
                                <div key={i} className="text-sm">
                                  <p className="font-bold text-slate-900">{a.claim}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{a.reason}</p>
                                  <p className="text-xs text-amber-700 mt-1">→ {a.pmAction}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Structural issues */}
                      <div className="rounded-lg border-l-4 border-red-400 bg-red-50/40 p-4">
                        <h3 className="font-semibold text-sm text-red-800 mb-3">
                          Structural issues ({result.analysis.structuralIssues.length})
                        </h3>
                        {result.analysis.structuralIssues.length === 0 ? (
                          <p className="text-sm text-slate-500">No structural issues found</p>
                        ) : (
                          <ul className="space-y-2">
                            {result.analysis.structuralIssues.map((issue, i) => (
                              <li key={i} className="text-sm text-slate-700 flex gap-2">
                                <span className="text-red-400 shrink-0">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Diff tab */}
                  {activeTab === 'diff' && (
                    <div className="space-y-6">
                      <DiffView
                        label="Summary"
                        original={result.analysis.diff.summary.original}
                        revised={result.analysis.diff.summary.revised}
                      />
                      <DiffView
                        label="Description"
                        original={result.analysis.diff.description.original}
                        revised={result.analysis.diff.description.revised}
                      />
                      <DiffView
                        label="Acceptance Criteria"
                        original={result.analysis.diff.acceptanceCriteria.original}
                        revised={result.analysis.diff.acceptanceCriteria.revised}
                      />
                    </div>
                  )}

                  {/* Refined ticket tab */}
                  {activeTab === 'refined' && (
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Summary
                        </label>
                        <p className="mt-1 text-sm font-medium text-slate-900 bg-slate-50 rounded-lg p-3 border border-slate-200">
                          {result.analysis.refinedTicket.summary}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Description
                        </label>
                        <pre className="mt-1 text-sm text-slate-800 bg-slate-50 rounded-lg p-3 border border-slate-200 whitespace-pre-wrap font-sans">
                          {result.analysis.refinedTicket.description}
                        </pre>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Acceptance Criteria
                        </label>
                        <ul className="mt-1 space-y-2">
                          {result.analysis.refinedTicket.acceptanceCriteria.map((ac, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-2"
                            >
                              <span className="text-emerald-500 font-bold shrink-0">✓</span>
                              {ac}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {result.analysis.refinedTicket.outOfScope.length > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Out of Scope
                          </label>
                          <ul className="mt-1 space-y-1">
                            {result.analysis.refinedTicket.outOfScope.map((item, i) => (
                              <li key={i} className="text-sm text-slate-700 flex gap-2">
                                <span className="text-slate-400">—</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.analysis.refinedTicket.assumptions.length > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Assumptions
                          </label>
                          <ul className="mt-1 space-y-1">
                            {result.analysis.refinedTicket.assumptions.map((item, i) => (
                              <li key={i} className="text-sm text-slate-700 flex gap-2">
                                <span className="text-slate-400">~</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            const t = result.analysis.refinedTicket
                            const text = [
                              `**Summary:** ${t.summary}`,
                              '',
                              `**Description:**\n${t.description}`,
                              '',
                              `**Acceptance Criteria:**\n${t.acceptanceCriteria.map(ac => `- ${ac}`).join('\n')}`,
                              t.outOfScope.length ? `\n**Out of Scope:**\n${t.outOfScope.map(i => `- ${i}`).join('\n')}` : '',
                              t.assumptions.length ? `\n**Assumptions:**\n${t.assumptions.map(i => `- ${i}`).join('\n')}` : '',
                            ].filter(Boolean).join('\n')
                            navigator.clipboard.writeText(text)
                          }}
                          className="text-sm text-indigo-600 hover:underline font-medium"
                        >
                          Copy to clipboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
