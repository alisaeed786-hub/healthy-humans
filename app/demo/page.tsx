'use client'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh', background: '#080C14', color: '#F1F5F9',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'fixed', top: 24, left: 24, background: 'transparent',
          border: '1px solid #1E293B', color: '#94A3B8', padding: '8px 16px',
          borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >← Back</button>

      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 560 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 999,
          border: '1px solid #1E293B', background: 'rgba(99,102,241,0.08)',
          fontSize: 12, color: '#818CF8', fontWeight: 600,
          marginBottom: 20, letterSpacing: '0.06em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
          LIVE DEMO
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: '#F1F5F9', marginBottom: 12 }}>
          Pick a ticket to proof
        </h1>
        <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.65 }}>
          Real tickets from the Healthy Humans Jira board.
          Select one to watch all three agents run in real time.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 580 }}>
        {[
          { key: 'SCRUM-11', summary: 'Sync observation order date with backend platform date', tag: 'Well-written', color: '#059669' },
          { key: 'SCRUM-22', summary: 'As a patient, I want to cancel or reschedule appointments online so I do not have to call the clinic', tag: 'Has gaps', color: '#D97706' },
          { key: 'SCRUM-30', summary: 'As a user, I want to see my health information so that I can stay informed', tag: 'Vague ticket', color: '#D97706' },
          { key: 'SCRUM-31', summary: 'As a patient, I want to video call my doctor so I can have a telehealth appointment without coming in', tag: 'Out of scope', color: '#E11D48' },
          { key: 'SCRUM-33', summary: "As a parent, I want to see my 14-year-old's full medical record including mental health notes", tag: 'Compliance violations', color: '#E11D48' },
        ].map(ticket => (
          <button
            key={ticket.key}
            onClick={() => router.push(`/analyze?ticket=${ticket.key}`)}
            style={{
              background: '#111827', border: '1px solid #1E293B',
              borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
              textAlign: 'left', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16,
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366F1')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1E293B')}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, letterSpacing: '0.04em' }}>
                {ticket.key}
              </div>
              <div style={{ fontSize: 14, color: '#F1F5F9', lineHeight: 1.55, fontWeight: 500 }}>
                {ticket.summary}
              </div>
            </div>
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 999,
              background: `${ticket.color}18`, color: ticket.color,
              border: `1px solid ${ticket.color}40`,
              whiteSpace: 'nowrap', letterSpacing: '0.02em',
            }}>{ticket.tag}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
