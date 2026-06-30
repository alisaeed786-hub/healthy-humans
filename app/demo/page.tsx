'use client'
import { useRouter } from 'next/navigation'

const DEMO_TICKETS = [
  { key: 'SCRUM-11', summary: 'As a patient, I want to view my lab results in the portal so I can review them after my appointment', tag: 'Well-written', tagColor: '#6FD6A8', desc: 'Clean ticket, verified against documentation, ready for sprint.' },
  { key: 'SCRUM-22', summary: 'As a patient, I want to cancel or reschedule appointments online so I do not have to call the clinic', tag: 'Has gaps', tagColor: '#F2B66D', desc: 'Close but 4 unverified claims. Fixable before sprint.' },
  { key: 'SCRUM-17', summary: 'Restrict proxy access for patients aged 12-17', tag: 'Edge case gaps', tagColor: '#F2B66D', desc: 'Missing edge case documentation. Needs PM action.' },
  { key: 'SCRUM-30', summary: 'As a user, I want to see my health information so that I can stay informed', tag: 'Too vague', tagColor: '#E89B6F', desc: 'No acceptance criteria, no scope, no user story format.' },
  { key: 'SCRUM-31', summary: 'As a patient, I want to video call my doctor so I can have a telehealth appointment without coming in', tag: 'Out of scope', tagColor: '#E11D48', desc: 'Explicitly excluded in product decisions documentation.' },
  { key: 'SCRUM-33', summary: "As a parent, I want to see my 14-year-old's full medical record including mental health notes", tag: 'Compliance violations', tagColor: '#E11D48', desc: '10+ unverified claims. Multiple compliance issues caught.' },
]

export default function DemoPage() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh', background: '#15171D', color: '#F1F5F9',
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 72,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: '#6366F1', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.03em',
          }}>P</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: '#F1F5F9' }}>ProductProof</span>
        </div>
        <a
          href="https://alisaeed-pm.vercel.app"
          style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none', fontWeight: 500 }}
        >Back to portfolio →</a>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '64px 24px 56px' }}>
        <h1 style={{
          fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 800,
          letterSpacing: '-0.03em', margin: '0 0 16px', color: '#F1F5F9',
        }}>
          See the verification engine in action
        </h1>
        <p style={{ fontSize: 16, color: '#94A3B8', margin: 0 }}>
          Six real tickets. Three outcomes. No setup required.
        </p>
      </section>

      {/* Grid */}
      <section style={{ padding: '0 24px 96px', maxWidth: 920, margin: '0 auto' }}>
        <div className="demo-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
        }}>
          {DEMO_TICKETS.map(t => (
            <div
              key={t.key}
              onClick={() => router.push(`/demo/${t.key}`)}
              className="demo-card"
              style={{
                background: '#1C1F27', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '22px 22px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'border-color 0.15s ease, transform 0.15s ease',
                ['--tag-color' as string]: t.tagColor,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: 12, fontWeight: 600, color: '#64748B', letterSpacing: '0.04em',
                }}>{t.key}</span>
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 999,
                  background: `${t.tagColor}18`, color: t.tagColor,
                  border: `1px solid ${t.tagColor}40`,
                  whiteSpace: 'nowrap', letterSpacing: '0.02em',
                }}>{t.tag}</span>
              </div>
              <div style={{ fontSize: 14.5, color: '#F1F5F9', lineHeight: 1.55, fontWeight: 500 }}>
                {t.summary}
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
                {t.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .demo-card:hover {
          border-color: var(--tag-color) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 720px) {
          .demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
