import type { AnalysisResult, LearningItem, QuizQuestion } from '../types'
import { getAnalysisFor } from '../mock/analysisScenarios'
import { sanitizeLearningPoint } from '../utils/sanitize'

export interface AIProvider {
  analyze(text: string): Promise<AnalysisResult>
  generateQuiz(
    items: LearningItem[],
    type: QuizQuestion['type'],
    count: number
  ): Promise<QuizQuestion[]>
}

function buildExplanation(item: LearningItem): string {
  const parts: string[] = []
  if (item.reading && item.reading !== item.word) {
    parts.push(`「${item.word}」は「${item.reading}」と読み、意味は「${item.meaning}」です。`)
  } else {
    parts.push(`「${item.word}」は「${item.meaning}」という意味です。`)
  }
  if (item.example) {
    parts.push(`例：${item.example}`)
  }
  return parts.join('\n')
}

function buildJudgmentCorrectExplanation(item: LearningItem): string {
  const parts: string[] = []
  parts.push(`「${item.word}」はこの文脈で自然に使われています。`)
  parts.push(`意味は「${item.meaning}」で、正しい用法です。`)
  if (item.example) {
    parts.push(`例：${item.example}`)
  }
  return parts.join('\n')
}

function buildJudgmentIncorrectExplanation(item: LearningItem): string {
  const parts: string[] = []
  parts.push(`「${item.word}」の使い方が不自然です。`)
  parts.push(`「${item.word}」は「${item.meaning}」という意味で、この文脈には合いません。`)
  if (item.example) {
    parts.push(`正しい例：${item.example}`)
  }
  return parts.join('\n')
}

// Generate a clearly wrong sentence for the given word.
// The wrong sentences are deliberately unnatural: wrong semantic domain,
// incorrect grammatical usage, or wrong register.
function generateWrongSentence(item: LearningItem): string {
  const wrongPatterns = [
    `${item.word}は美味しいですね。`,
    `${item.word}な天気になりました。`,
    `昨日${item.word}を食べに行きました。`,
    `${item.word}を着てパーティーに行きます。`,
    `先週の${item.word}は本当に楽しかったです。`,
    `${item.word}がとても綺麗でした。`,
    `今日は${item.word}の気分です。`,
    `${item.word}を飲みながら話しましょう。`,
  ]
  return wrongPatterns[Math.floor(Math.random() * wrongPatterns.length)]
}

export function createMockAIProvider(): AIProvider {
  return {
    async analyze(text: string): Promise<AnalysisResult> {
      await new Promise((r) => setTimeout(r, 1200))
      const raw = getAnalysisFor(text)
      // Sanitize every item (defense in depth — mock data should be clean, but sanitize anyway)
      const items = raw.items
        .map((item) => sanitizeLearningPoint(item as unknown as Record<string, unknown>))
        .filter((item): item is Record<string, unknown> => item !== null)
      return { input: raw.input, items: items as unknown as AnalysisResult['items'] }
    },

    async generateQuiz(
      items: LearningItem[],
      type: QuizQuestion['type'],
      count: number
    ): Promise<QuizQuestion[]> {
      await new Promise((r) => setTimeout(r, 800))
      const pool = items.filter((i) => !i.archived)
      if (pool.length === 0) return []

      const safeCount = Math.min(count, pool.length)
      const questions: QuizQuestion[] = []

      if (type === 'judgment') {
        // ~50/50 correct/incorrect distribution
        for (let i = 0; i < safeCount; i++) {
          const item = pool[i % pool.length]
          const isCorrectUsage = i % 2 === 0 // even = correct, odd = incorrect

          if (isCorrectUsage) {
            const sentence = item.example || `${item.word}を使った正しい文です。`
            questions.push({
              id: `q-gen-${i}`,
              type: 'judgment',
              question: `目標ワード：${item.word}\n\n例文：\n${sentence}\n\nこの文での「${item.word}」の使い方は正しいですか。`,
              answer: 'true',
              explanation: buildJudgmentCorrectExplanation(item),
              source: item.word,
            })
          } else {
            const wrongSentence = generateWrongSentence(item)
            questions.push({
              id: `q-gen-${i}`,
              type: 'judgment',
              question: `目標ワード：${item.word}\n\n例文：\n${wrongSentence}\n\nこの文での「${item.word}」の使い方は正しいですか。`,
              answer: 'false',
              explanation: buildJudgmentIncorrectExplanation(item),
              source: item.word,
            })
          }
        }
        return questions
      }

      // choice / fill
      for (let i = 0; i < safeCount; i++) {
        const item = pool[i % pool.length]
        if (type === 'choice') {
          const others = pool.filter((x) => x.id !== item.id).map((x) => x.meaning)
          const options = [item.meaning, ...others.slice(0, 3)]
          for (let j = options.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1))
            ;[options[j], options[k]] = [options[k], options[j]]
          }
          questions.push({
            id: `q-gen-${i}`,
            type: 'choice',
            question: `「${item.word}」の正しい意味は？`,
            options,
            answer: item.meaning,
            explanation: buildExplanation(item),
            source: item.word,
          })
        } else {
          // fill
          questions.push({
            id: `q-gen-${i}`,
            type: 'fill',
            question: `「______」—— ${item.meaning}`,
            answer: item.word,
            explanation: buildExplanation(item),
            source: item.word,
          })
        }
      }
      return questions
    },
  }
}

export const mockAIProvider = createMockAIProvider()
