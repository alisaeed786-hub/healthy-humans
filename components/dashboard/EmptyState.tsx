'use client'
export default function EmptyState() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40,
    }}>
      <div style={{
        width: 62, height: 62, borderRadius: 16, background: '#eef2ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 22,
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2.2" stroke="#3730A3" strokeWidth="1.7" />
          <line x1="9" y1="4.6" x2="9" y2="19.4" stroke="#c7d2fe" strokeWidth="1.5" />
          <line x1="15" y1="4.6" x2="15" y2="19.4" stroke="#c7d2fe" strokeWidth="1.5" />
        </svg>
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, color: '#1e293b', marginBottom: 9, letterSpacing: '-0.01em' }}>
        Select a project to view its board
      </div>
      <div style={{ fontSize: 14, color: '#64748b', maxWidth: 400, lineHeight: 1.65 }}>
        Pick a project from the sidebar and ProductProof shows every ticket with its
        readiness — each one proofed against your acceptance criteria, dependencies,
        and edge cases.
      </div>
    </div>
  )
}
