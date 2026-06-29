'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: 999,
      border: '1px solid #334155', fontSize: 12, fontWeight: 500,
      color: '#94A3B8', letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function VerifiedRow({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 14px', background: '#052E16',
      border: '1px solid #064E3B', borderRadius: 8, marginBottom: 8,
    }}>
      <span style={{ color: '#059669', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 2 }}>✓</span>
      <span style={{ fontSize: 13, color: '#86EFAC', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

function AssumedRow({ text, action }: { text: string; action: string }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      padding: '10px 14px', background: '#1C1107',
      border: '1px solid #92400E', borderRadius: 8, marginBottom: 8,
    }}>
      <span style={{ color: '#D97706', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 2 }}>≈</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#FCD34D', lineHeight: 1.6 }}>{text}</div>
        <div style={{ fontSize: 12, color: '#D97706', marginTop: 4, lineHeight: 1.5 }}>→ {action}</div>
      </div>
    </div>
  )
}

function GlowCursor() {
  useEffect(() => {
    const cursor = document.createElement('div')
    cursor.id = 'glow-cursor'
    cursor.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(99,102,241,0.6);
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.1s ease, width 0.2s ease, height 0.2s ease, background 0.2s ease;
      filter: blur(4px);
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `
    document.body.appendChild(cursor)

    const trail = document.createElement('div')
    trail.id = 'glow-trail'
    trail.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(99,102,241,0.15);
      pointer-events: none;
      z-index: 9998;
      transition: left 0.12s ease, top 0.12s ease, width 0.2s ease, height 0.2s ease;
      filter: blur(8px);
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `
    document.body.appendChild(trail)

    let trailX = 0, trailY = 0

    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = e.clientX + 'px'
      cursor.style.top = e.clientY + 'px'
      trailX += (e.clientX - trailX) * 0.15
      trailY += (e.clientY - trailY) * 0.15
      trail.style.left = trailX + 'px'
      trail.style.top = trailY + 'px'
    }

    const onEnterClickable = () => {
      cursor.style.width = '32px'
      cursor.style.height = '32px'
      cursor.style.background = 'rgba(99,102,241,0.9)'
      trail.style.width = '64px'
      trail.style.height = '64px'
    }

    const onLeaveClickable = () => {
      cursor.style.width = '20px'
      cursor.style.height = '20px'
      cursor.style.background = 'rgba(99,102,241,0.6)'
      trail.style.width = '40px'
      trail.style.height = '40px'
    }

    const clickables = document.querySelectorAll('a, button, [role="button"]')
    clickables.forEach(el => {
      el.addEventListener('mouseenter', onEnterClickable)
      el.addEventListener('mouseleave', onLeaveClickable)
    })

    window.addEventListener('mousemove', moveCursor)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      cursor.remove()
      trail.remove()
    }
  }, [])

  return null
}

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const scrollLight = document.createElement('div')
    scrollLight.style.cssText = `
      position: fixed;
      left: 50%;
      width: 800px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translateX(-50%);
      transition: top 0.3s ease;
      filter: blur(30px);
    `
    document.body.appendChild(scrollLight)

    const updateLight = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      scrollLight.style.top = (scrollY + viewportHeight * 0.3) + 'px'
      setScrolled(scrollY > 20)
    }

    window.addEventListener('scroll', updateLight)
    updateLight()

    return () => {
      window.removeEventListener('scroll', updateLight)
      scrollLight.remove()
    }
  }, [])

  return (
    <div style={{ position: 'relative', background: '#080C14', color: '#F1F5F9', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <GlowCursor />

      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '5%', right: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '25%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(8,12,20,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #1E293B' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: '#6366F1', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.03em',
          }}>P</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: '#F1F5F9' }}>ProductProof</span>
        </div>
        <button
          onClick={() => router.push('/demo')}
          style={{
            padding: '9px 20px', background: '#6366F1', color: '#fff',
            border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'inherit',
          }}
        >Try the demo →</button>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 999,
          border: '1px solid #1E293B', background: 'rgba(99,102,241,0.08)',
          fontSize: 12, color: '#818CF8', fontWeight: 600,
          marginBottom: 32, letterSpacing: '0.06em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'inline-block', flexShrink: 0 }} />
          AI-POWERED PM CO-PILOT
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6.5vw, 76px)',
          fontWeight: 800, lineHeight: 1.06,
          letterSpacing: '-0.04em',
          margin: '0 0 24px', maxWidth: 820,
          color: '#F1F5F9',
          background: 'linear-gradient(135deg, #F1F5F9 30%, #818CF8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Prove every ticket<br />before you build it
        </h1>

        <p style={{
          fontSize: 18, color: '#94A3B8', lineHeight: 1.75,
          maxWidth: 540, margin: '0 0 40px',
        }}>
          Three AI agents verify every claim in your Jira tickets against your
          documentation — telling you exactly what is confirmed and what is
          assumed before sprint planning.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          <button
            onClick={() => router.push('/demo')}
            style={{
              padding: '13px 28px', background: '#6366F1', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'inherit',
              boxShadow: '0 0 40px rgba(99,102,241,0.35)',
            }}
          >Try the demo →</button>
          <a
            href="https://github.com/alisaeed786-hub/healthy-humans"
            target="_blank" rel="noopener noreferrer"
            style={{
              padding: '13px 28px', background: 'transparent', color: '#F1F5F9',
              border: '1px solid #1E293B', borderRadius: 10, fontSize: 15,
              fontWeight: 600, textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', letterSpacing: '-0.01em',
            }}
          >View on GitHub</a>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Next.js 14', 'TypeScript', 'Anthropic Claude', 'Jira REST API', 'Confluence RAG', 'Vercel'].map(t => <Pill key={t}>{t}</Pill>)}
        </div>
      </section>

      {/* Problem */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, color: '#6366F1', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>The Problem</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F1F5F9', margin: 0 }}>
            The 1-hour sprint planning crunch
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { icon: '💬', title: 'Requirements lost between Slack and Jira', body: 'Decisions made in standup never make it into the ticket. Engineers push back. The PM has to go find the thread.' },
            { icon: '🎲', title: 'Assumptions treated as facts', body: 'The API supports this ends up in the ticket as a requirement. Nobody checks. Engineering discovers it does not two sprints later.' },
            { icon: '⚠️', title: 'Compliance gaps reach engineering', body: 'A ticket misses a data handling rule. It ships. The review catches it after the sprint is already done.' },
          ].map(item => (
            <div key={item.title} style={{
              background: '#111827', border: '1px solid #1E293B',
              borderRadius: 14, padding: '28px 24px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{item.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#F1F5F9', lineHeight: 1.35 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, flex: 1 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, color: '#6366F1', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F1F5F9', margin: 0 }}>
            Three agents. One verdict.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { n: '01', name: 'Structural Analyst', color: '#818CF8', border: '#3730A3', desc: 'Checks ticket format, acceptance criteria, scope definition, and technical prescription. Catches structural problems before documentation review.' },
            { n: '02', name: 'Contextual Verifier', color: '#34D399', border: '#064E3B', desc: 'Cross-references every claim against your corpus. Only marks a claim Verified if it can quote the exact source sentence. Everything else is Assumed.' },
            { n: '03', name: 'Story Writer', color: '#FCD34D', border: '#92400E', desc: 'Rewrites the ticket using only verified facts. Never invents requirements. Flags every assumption so the PM knows what to confirm before sprint.' },
          ].map(agent => (
            <div key={agent.n} style={{
              background: '#111827', border: `1px solid ${agent.border}`,
              borderRadius: 14, padding: '28px 24px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: agent.color }}>{agent.n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#F1F5F9' }}>{agent.name}</div>
              <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>{agent.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The Output */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, color: '#6366F1', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>The Output</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F1F5F9', margin: '0 0 12px' }}>
            Know what you know.<br />Know what you do not.
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', maxWidth: 480, margin: '0 auto' }}>
            Every ticket gets a verdict — not a score. The PM knows exactly what to defend and what to go confirm.
          </p>
        </div>

        <div style={{
          background: '#111827', border: '1px solid #1E293B',
          borderRadius: 16, padding: '28px 28px 24px',
          maxWidth: 680, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>SCRUM-33</span>
            <span style={{ padding: '4px 12px', borderRadius: 999, background: '#1C0A0F', color: '#E11D48', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', border: '1px solid #7F1D1D' }}>NOT READY</span>
          </div>

          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20, lineHeight: 1.6, borderBottom: '1px solid #1E293B', paddingBottom: 20 }}>
            As a parent, I want to see my child&apos;s full record so I can monitor their health.
          </p>

          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>Verified (2)</div>
            <VerifiedRow text="Proxy access must be scoped to minimum necessary data — confirmed in compliance documentation." />
            <VerifiedRow text="Role changes must be logged in the audit trail — confirmed in system architecture docs." />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>Assumed (5) — review before presenting</div>
            <AssumedRow
              text="Full record access is permitted for proxy users"
              action="No documentation confirms this. Contradicts documented access restrictions. PM must define scope."
            />
            <AssumedRow
              text="Sensitive records are visible to parent proxies"
              action="Contradicts documented access restrictions. PM must resolve before sprint."
            />
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid #1E293B' }}>
            <span style={{ fontSize: 13, color: '#818CF8', lineHeight: 1.5 }}>
              5 assumptions in this ticket. Resolve them before presenting to engineering.
            </span>
          </div>
        </div>
      </section>

      {/* Industry Spaces */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#6366F1', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>Industry Spaces</p>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F1F5F9', marginBottom: 12 }}>
          Works for any industry.<br />Speaks your language.
        </h2>
        <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
          Each space ships with a pre-built corpus of domain knowledge and compliance guardrails baked in.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Healthcare', color: '#0891B2' },
            { label: 'Fintech', color: '#7C3AED' },
            { label: 'SaaS', color: '#0284C7' },
            { label: 'Enterprise', color: '#64748B' },
            { label: 'E-commerce', color: '#EA580C' },
          ].map(s => (
            <span key={s.label} style={{
              padding: '9px 22px', borderRadius: 999,
              border: `1px solid ${s.color}50`,
              background: `${s.color}15`,
              color: '#F1F5F9', fontSize: 14, fontWeight: 500,
            }}>{s.label}</span>
          ))}
        </div>
      </section>

      {/* Built by */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: '40px 36px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: '#3730A3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 22, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>A</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#F1F5F9', marginBottom: 10 }}>Built by Ali Saeed</div>
          <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75, marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
            Product Manager. A portfolio project demonstrating AI agent architecture,
            product thinking, and full-stack development — built to solve a real
            problem PMs face every sprint.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
            {['Next.js 14', 'TypeScript', 'Anthropic Claude', 'Jira REST API', 'Confluence RAG', 'Vercel'].map(t => <Pill key={t}>{t}</Pill>)}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a
              href="https://www.linkedin.com/in/alisaeed786"
              target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 24px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
            >LinkedIn</a>
            <a
              href="https://github.com/alisaeed786-hub/healthy-humans"
              target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 24px', background: 'transparent', color: '#F1F5F9', border: '1px solid #1E293B', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
            >GitHub</a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#F1F5F9', marginBottom: 16 }}>
          Ready to see it work?
        </h2>
        <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 36 }}>
          No account needed. Pick a ticket and watch the agents run.
        </p>
        <button
          onClick={() => router.push('/demo')}
          style={{
            padding: '15px 40px', background: '#6366F1', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'inherit',
            boxShadow: '0 0 60px rgba(99,102,241,0.4)',
          }}
        >Try the demo →</button>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        padding: '28px 48px',
        borderTop: '1px solid #1E293B',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>P</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>ProductProof</span>
          <span style={{ fontSize: 13, color: '#475569' }}>— Prove it before you build it</span>
        </div>
        <span style={{ fontSize: 13, color: '#475569' }}>© 2026 Ali Saeed</span>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media (max-width: 640px) {
          nav { padding: 0 20px !important; }
          footer { padding: 24px 20px !important; flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  )
}
