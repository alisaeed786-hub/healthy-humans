'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import Board from '@/components/dashboard/Board'
import EmptyState from '@/components/dashboard/EmptyState'
import TicketDrawer from '@/components/dashboard/TicketDrawer'
import { fetchProjects } from '@/lib/dashboard/projects'
import { ALL_TICKETS_ID, flattenTickets, applyOverrides } from '@/lib/dashboard/selectors'
import { COLORS } from '@/lib/dashboard/constants'
import type {
  DashboardProject,
  DashboardTicket,
  FilterState,
  TabId,
  BatchProofState,
  TicketOverride,
} from '@/lib/dashboard/types'

const DEFAULT_FILTERS: FilterState = { sprint: 'all', status: 'all', search: '' }

const DEFAULT_BATCH: BatchProofState = {
  queue: [],
  currentlyProofing: null,
  done: 0,
  total: 0,
  cancelRequested: false,
}

export default function DashboardPage() {
  const router = useRouter()

  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const [ticketOverrides, setTicketOverrides] = useState<Record<string, TicketOverride>>({})
  const [batchProof, setBatchProof] = useState<BatchProofState>(DEFAULT_BATCH)

  const cancelRef = useRef(false)
  const processingRef = useRef(false)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const allTickets = flattenTickets(projects)
  const isAll = selectedId === ALL_TICKETS_ID
  const selProj = isAll ? null : projects.find(p => p.id === selectedId) || null
  const hasSelection = isAll || !!selProj

  const sourceTickets: DashboardTicket[] = isAll
    ? allTickets
    : selProj
    ? selProj.tickets.map(t => ({ ...t, projectId: selProj.id, projectName: selProj.name, projectDot: selProj.dot }))
    : []

  const displayTickets = applyOverrides(sourceTickets, ticketOverrides)
  const openTicket = applyOverrides(allTickets, ticketOverrides).find(t => t.key === openKey) || null

  function selectProject(id: string) {
    setSelectedId(id)
    setFilters(DEFAULT_FILTERS)
    setActiveTab('all')
    setSelectedKeys(new Set())
    setOpenKey(null)
  }

  function handleFiltersChange(partial: Partial<FilterState>) {
    setFilters(prev => ({ ...prev, ...partial }))
  }

  function handleTabChange(tab: TabId) {
    setActiveTab(tab)
    setSelectedKeys(new Set())
  }

  function handleToggleSelect(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleSelectAll() {
    setSelectedKeys(new Set(displayTickets.map(t => t.key)))
  }

  function handleClearSelect() {
    setSelectedKeys(new Set())
  }

  function handleProofComplete(key: string, override: TicketOverride) {
    setTicketOverrides(prev => ({ ...prev, [key]: override }))
  }

  const processBatchQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true

    setBatchProof(prev => {
      if (prev.queue.length === 0) {
        processingRef.current = false
        return prev
      }

      const [next, ...rest] = prev.queue

      if (cancelRef.current) {
        cancelRef.current = false
        processingRef.current = false
        return DEFAULT_BATCH
      }

      setTimeout(async () => {
        setBatchProof(p => ({ ...p, currentlyProofing: next.key }))
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketKey: next.key }),
          })
          const data = await res.json()
          if (res.ok && data.analysis) {
            const a = data.analysis
            setTicketOverrides(prev => ({
              ...prev,
              [next.key]: {
                status: a.status,
                hhAssumedCount: a.assumedCount,
                hhVerifiedCount: a.verifiedCount,
                hhKeywords: a.confluencePageTitles?.join(', ') || null,
                hhConfluencePages: a.confluencePageTitles?.join(', ') || null,
              }
            }))
          }
        } catch {
          // silent — ticket stays not_proofed
        } finally {
          setBatchProof(prev => ({
            ...prev,
            queue: rest,
            currentlyProofing: null,
            done: prev.done + 1,
          }))
          processingRef.current = false
          if (rest.length > 0 && !cancelRef.current) {
            processBatchQueue()
          } else {
            setBatchProof(prev => ({ ...prev, total: prev.done + 1 }))
            setTimeout(() => setBatchProof(DEFAULT_BATCH), 2000)
          }
        }
      }, 0)

      return prev
    })
  }, [])

  function handleRunProof() {
    if (selectedKeys.size === 0) return
    if (batchProof.total > 0) return

    const items = Array.from(selectedKeys).map(key => ({
      key,
      projectId: allTickets.find(t => t.key === key)?.projectId || '',
    }))

    cancelRef.current = false
    setBatchProof({
      queue: items.slice(1),
      currentlyProofing: null,
      done: 0,
      total: items.length,
      cancelRequested: false,
    })
    setSelectedKeys(new Set())
    processBatchQueue()
  }

  useEffect(() => {
    if (batchProof.queue.length > 0 && !processingRef.current) {
      processBatchQueue()
    }
  }, [batchProof.queue, processBatchQueue])

  if (loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center',
        justifyContent: 'center', background: COLORS.background,
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `3px solid ${COLORS.primarySoft}`,
          borderTopColor: COLORS.primary,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>Loading your projects...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center',
        justifyContent: 'center', background: COLORS.background, flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 16, color: '#be123c', fontWeight: 600 }}>Failed to load projects</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{
          marginTop: 8, padding: '9px 18px', background: COLORS.primary,
          color: '#fff', border: 'none', borderRadius: 9,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Retry</button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      background: COLORS.background, color: COLORS.text, overflow: 'hidden',
    }}>
      <Sidebar
        projects={projects}
        selectedId={selectedId}
        onSelect={selectProject}
        onNewProject={() => {}}
      />

      <main style={{ flex: 1, minWidth: 0, position: 'relative', height: '100vh' }}>
        {hasSelection ? (
          <Board
            title={isAll ? 'All Tickets' : selProj!.name}
            breadcrumb={isAll ? 'Across all projects' : selProj!.section}
            tickets={displayTickets}
            isAll={isAll}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onOpenTicket={setOpenKey}
            onRunProof={handleRunProof}
            selectedKeys={selectedKeys}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelect={handleClearSelect}
            batchProof={batchProof}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        ) : (
          <EmptyState />
        )}
      </main>

      <TicketDrawer
        ticket={openTicket}
        batchRunning={batchProof.total > 0}
        onClose={() => setOpenKey(null)}
        onProofComplete={handleProofComplete}
      />
    </div>
  )
}
