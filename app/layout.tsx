import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Healthy Humans — Jira Ticket Pressure Tester',
  description: 'Pressure test Jira tickets with Confluence RAG and Claude AI',
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
