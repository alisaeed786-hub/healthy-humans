import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProductProof — Prove it before you build it',
  description: 'AI-powered PM co-pilot that verifies every claim in your Jira tickets against your documentation before sprint planning. Know what is verified and what is assumed before engineering starts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  )
}
