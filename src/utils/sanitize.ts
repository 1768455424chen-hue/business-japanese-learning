const PAREN_CN_PATTERN = /[（(][^)）]*[一-鿿]+[^)）]*[)）]/g

export function stripParenAnnotation(text: string): string {
  return text.replace(PAREN_CN_PATTERN, '').replace(/\s+/g, ' ').trim()
}

function extractParenContent(text: string): string | null {
  const match = text.match(/[（(]([^)）]*[一-鿿]+[^)）]*)[)）]/)
  return match ? match[1].trim() : null
}

function sanitizeString(val: unknown, fallback: string): string {
  if (typeof val === 'string' && val.trim()) return val.trim()
  return fallback
}

function sanitizeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val
    .map((v) => {
      if (typeof v === 'string') return stripParenAnnotation(v)
      if (typeof v === 'object' && v !== null && 'word' in v) {
        return stripParenAnnotation(String((v as Record<string, unknown>).word))
      }
      return ''
    })
    .filter((v) => v.length > 0)
}

type SimilarExpression = string | { word: string; reading?: string; meaning?: string }

function sanitizeSimilarExpressions(val: unknown): SimilarExpression[] {
  if (!Array.isArray(val)) return []
  return val
    .map((v): SimilarExpression | null => {
      if (typeof v === 'string') {
        const cleaned = stripParenAnnotation(v)
        return cleaned || null
      }
      if (typeof v === 'object' && v !== null && 'word' in v) {
        const obj = v as Record<string, unknown>
        const word = stripParenAnnotation(sanitizeString(obj.word, ''))
        if (!word) return null
        const reading = stripParenAnnotation(sanitizeString(obj.reading, ''))
        const meaning = stripParenAnnotation(sanitizeString(obj.meaning, ''))
        // Only include non-empty optional fields
        const result: { word: string; reading?: string; meaning?: string } = { word }
        if (reading) result.reading = reading
        if (meaning) result.meaning = meaning
        return result
      }
      return null
    })
    .filter((v): v is SimilarExpression => v !== null)
}

function sanitizeRuby(val: unknown, word: string): string[] | undefined {
  if (!Array.isArray(val) || val.length === 0) return undefined
  const cleaned = val.filter((v) => typeof v === 'string' && v.trim())
  if (cleaned.length === 0) return undefined
  const kanjiCount = (word.match(/[一-鿿]/g) || []).length
  if (cleaned.length !== kanjiCount) return undefined
  return cleaned as string[]
}

/**
 * Sanitize a raw AI response item into a clean LearningPoint.
 * Handles: word（Chinese）→ split, placeholder meanings, polluted similarExpressions.
 */
export function sanitizeLearningPoint(raw: Record<string, unknown>): Record<string, unknown> | null {
  const rawWord = sanitizeString(raw.word, '')
  if (!rawWord) return null

  let word = stripParenAnnotation(rawWord)
  if (!word) return null

  const extractedMeaning = extractParenContent(rawWord)

  const rawReading = sanitizeString(raw.reading, '')
  const reading = stripParenAnnotation(rawReading)

  const rawMeaning = sanitizeString(raw.meaning, '')
  let meaning = stripParenAnnotation(rawMeaning)
  if ((!meaning || meaning === '类似表达' || meaning === 'その他') && extractedMeaning) {
    meaning = extractedMeaning
  }

  const partOfSpeech = sanitizeString(raw.partOfSpeech, 'その他')

  const categoryRaw = sanitizeString(raw.category, 'expression')
  const category = ['word', 'grammar', 'expression'].includes(categoryRaw)
    ? (categoryRaw as 'word' | 'grammar' | 'expression')
    : 'expression'

  const example = {
    ja: sanitizeString((raw.example as Record<string, unknown> | undefined)?.ja, ''),
    zh: sanitizeString((raw.example as Record<string, unknown> | undefined)?.zh, ''),
  }

  const grammar = sanitizeString(raw.grammar, '')
  const businessExplanation = sanitizeString(raw.businessExplanation, '')
  const collocations = sanitizeStringArray(raw.collocations)
  const similarExpressions = sanitizeSimilarExpressions(raw.similarExpressions)

  let components: Record<string, unknown>[] | undefined
  if (Array.isArray(raw.components) && raw.components.length > 0) {
    components = raw.components
      .map((c) => sanitizeLearningPoint(c as Record<string, unknown>))
      .filter((c): c is Record<string, unknown> => c !== null)
    if (components.length === 0) components = undefined
  }

  const ruby = sanitizeRuby(raw.ruby, word)

  const result: Record<string, unknown> = {
    word,
    reading,
    ruby,
    meaning,
    partOfSpeech,
    category,
    example,
    grammar,
    collocations,
    businessExplanation,
    similarExpressions,
  }
  if (components) result.components = components

  return result
}
