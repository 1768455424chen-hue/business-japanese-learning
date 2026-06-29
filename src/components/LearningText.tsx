import { useLearningMode } from '../contexts/LearningModeContext'

interface Props {
  text: string
  reading: string
  ruby?: string[]
  className?: string
  readingClassName?: string
}

function hasKanji(text: string): boolean {
  return /[一-鿿]/.test(text)
}

export default function LearningText({ text, reading, ruby, className = '', readingClassName = '' }: Props) {
  const { mode } = useLearningMode()

  if (!hasKanji(text)) {
    return <span className={className}>{text}</span>
  }

  // Per-character ruby: each kanji gets its own reading above
  if (ruby && ruby.length > 0) {
    let kanjiIdx = 0
    const chars: Array<{ char: string; charReading?: string }> = []

    for (const ch of text) {
      if (/[一-鿿]/.test(ch)) {
        chars.push({ char: ch, charReading: ruby[kanjiIdx] ?? undefined })
        kanjiIdx++
      } else {
        chars.push({ char: ch })
      }
    }

    if (mode === 'always') {
      return (
        <span className={`inline-flex items-end tracking-tight ${className}`}>
          {chars.map((c, i) => (
            <span key={i} className="inline-flex flex-col items-center">
              <span
                className={`text-[9px] leading-none mb-0.5 whitespace-nowrap text-text-muted ${
                  !c.charReading ? 'invisible' : ''
                } ${readingClassName}`}
              >
                {c.charReading || '​'}
              </span>
              <span>{c.char}</span>
            </span>
          ))}
        </span>
      )
    }

    // Hover mode: ruby hidden by default, appears on hover
    return (
      <span className={`inline-flex items-end tracking-tight cursor-default group ${className}`}>
        {chars.map((c, i) => (
          <span key={i} className="inline-flex flex-col items-center">
            <span
              className={`text-[9px] leading-none mb-0.5 whitespace-nowrap text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ${
                !c.charReading ? 'invisible' : ''
              }`}
            >
              {c.charReading || '​'}
            </span>
            <span className="transition-transform group-hover:scale-110 origin-center">
              {c.char}
            </span>
          </span>
        ))}
      </span>
    )
  }

  // Fallback: no ruby data — show whole reading above
  if (mode === 'always') {
    return (
      <span className={`inline-flex flex-col ${className}`}>
        <span className={`text-[11px] text-text-muted leading-none mb-0.5 ${readingClassName}`}>{reading}</span>
        <span>{text}</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex flex-col items-start cursor-default group ${className}`}>
      <span className="text-[11px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity leading-none mb-0.5 whitespace-nowrap">
        {reading}
      </span>
      <span className="transition-transform group-hover:scale-110 origin-left">
        {text}
      </span>
    </span>
  )
}
