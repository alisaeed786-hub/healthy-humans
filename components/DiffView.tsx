'use client'

import { diffWords } from 'diff'

interface Props {
  original: string
  revised: string
  label: string
}

export default function DiffView({ original, revised, label }: Props) {
  const parts = diffWords(original, revised)

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {label}
      </h4>
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm leading-relaxed font-mono whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.added) {
            return (
              <mark key={i} className="diff-added rounded px-0.5">
                {part.value}
              </mark>
            )
          }
          if (part.removed) {
            return (
              <span key={i} className="diff-removed">
                {part.value}
              </span>
            )
          }
          return <span key={i}>{part.value}</span>
        })}
      </div>
    </div>
  )
}
