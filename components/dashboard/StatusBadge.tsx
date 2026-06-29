'use client'
import { STATUS_META } from '@/lib/dashboard/constants'
import type { ProofStatus } from '@/lib/dashboard/types'

export default function StatusBadge({ status }: { status: ProofStatus }) {
  const m = STATUS_META[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11.5, fontWeight: 600,
      color: m.color, background: m.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot }} />
      {m.label}
    </span>
  )
}
