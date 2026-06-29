// ===== Core Learning Item =====
export interface LearningItem {
  id: string
  word: string
  reading: string
  ruby?: string[]
  meaning: string
  partOfSpeech: string
  category: 'word' | 'grammar' | 'expression'
  example: string
  exampleMeaning: string
  sourceSentence: string | null
  source: 'manual' | 'ai-analysis'
  mastery: 'RECOGNIZE' | 'CAN_USE' | 'PROFICIENT'
  nextReviewDate: string
  createdAt: string
  archived: boolean
}

// Backward-compat alias (Phase 2 used BusinessExpression)
export type BusinessExpression = LearningItem

// ===== AI Analysis =====

/** A similar expression can be a plain string (legacy/mock) or a structured object (real AI). */
export type SimilarExpression = string | { word: string; reading?: string; meaning?: string }

export interface LearningPoint {
  word: string
  reading: string
  ruby?: string[]
  meaning: string
  partOfSpeech: string
  category: 'word' | 'grammar' | 'expression'
  example: { ja: string; zh: string }
  grammar: string
  collocations: string[]
  businessExplanation: string
  similarExpressions: SimilarExpression[]
  components?: LearningPoint[]
}

export interface AnalysisResult {
  input: string
  items: LearningPoint[]
}

// ===== Quiz =====
export interface QuizQuestion {
  id: string
  type: 'choice' | 'fill' | 'judgment'
  question: string
  options?: string[]
  answer: string
  explanation?: string
  source: string
}

// ===== Settings =====
export interface Settings {
  provider: string
  providerPreset: string
  model: string
  apiKey: string
  baseUrl: string
  temperature: number
  language: string
}

// ===== Review =====
export interface ReviewRecord {
  id: string
  itemId: string
  result: 'correct' | 'incorrect' | 'skip'
  source: 'review' | 'quiz'
  quizMode?: 'choice' | 'fill' | 'judgment'
  reviewedAt: string
  duration: number
}
