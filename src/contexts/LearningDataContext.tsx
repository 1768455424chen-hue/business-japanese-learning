import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { LearningItem, LearningPoint, ReviewRecord, Settings } from '../types'
import { getDatabase, persistDatabase } from '../database'
import {
  getAllItems,
  addItems as dbAddItems,
  removeItem as dbRemoveItem,
  getAllReviewRecords,
  addReviewRecord as dbAddReviewRecord,
  getAllSettings,
  updateSettingValue,
  updateItemMastery,
  archiveItem,
  hasPassedAllQuizModes,
  repairPollutedItems,
} from '../database/repository'
import type { Database } from 'sql.js'
import { getDueItems, getDueCount, calculateNextReviewDate } from '../services/reviewScheduler'
import { updateMastery } from '../services/masteryUpdater'

// ===== Word Normalize =====
// Clean "Japanese（Chinese）" pattern from word field,
// extracting Chinese meaning into the meaning field.
function normalizeWord(word: string, meaning: string): { word: string; meaning: string } {
  const match = word.match(/^(.+?)（(.+?)）$/)
  if (match) {
    return { word: match[1].trim(), meaning: match[2].trim() }
  }
  return { word, meaning }
}

// ===== Default Settings =====
const defaultSettings: Settings = {
  provider: 'mock',
  providerPreset: 'mock',
  model: '',
  apiKey: '',
  baseUrl: '',
  temperature: 0.2,
  language: 'zh',
}

// ===== Context =====
interface LearningDataContextValue {
  items: LearningItem[]
  reviewRecords: ReviewRecord[]
  settings: Settings
  addItems: (points: LearningPoint[], sourceSentence: string) => { inserted: number; skipped: number }
  removeItem: (id: string) => void
  recordReview: (itemId: string, result: ReviewRecord['result'], source: ReviewRecord['source'], quizMode?: ReviewRecord['quizMode']) => string | null
  updateSettings: (s: Partial<Settings>) => void
  getDueItems: () => LearningItem[]
  getDueCount: () => number
}

const LearningDataContext = createContext<LearningDataContextValue | null>(null)

export function LearningDataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null)
  const [items, setItems] = useState<LearningItem[]>([])
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [ready, setReady] = useState(false)

  // Initialize DB on mount
  useEffect(() => {
    getDatabase().then((database) => {
      const repaired = repairPollutedItems(database)
      if (repaired > 0) {
        persistDatabase(database)
        console.log(`[repair] fixed ${repaired} polluted item(s)`)
      }
      setDb(database)
      setItems(getAllItems(database))
      setReviewRecords(getAllReviewRecords(database))
      setSettings(getAllSettings(database))
      setReady(true)
    })
  }, [])

  const addItems = useCallback(
    (points: LearningPoint[], sourceSentence: string) => {
      if (!db) return { inserted: 0, skipped: points.length }
      const today = new Date().toISOString().split('T')[0]
      const newItems: LearningItem[] = points.map((p) => {
        const { word, meaning } = normalizeWord(p.word, p.meaning)
        return {
          id: crypto.randomUUID(),
          word,
          reading: p.reading,
          ruby: p.ruby,
          meaning,
          partOfSpeech: p.partOfSpeech,
          category: p.category,
          example: p.example.ja,
          exampleMeaning: p.example.zh,
          sourceSentence,
          source: 'ai-analysis' as const,
          mastery: 'RECOGNIZE' as const,
          nextReviewDate: today,
          createdAt: new Date().toISOString(),
          archived: false,
        }
      })

      const result = dbAddItems(db, newItems)
      // Reload items from DB to refresh Context state
      setItems(getAllItems(db))
      persistDatabase(db)
      return result
    },
    [db],
  )

  const removeItem = useCallback(
    (id: string) => {
      if (!db) return
      dbRemoveItem(db, id)
      setItems(getAllItems(db))
      persistDatabase(db)
    },
    [db],
  )

  const recordReview = useCallback(
    (itemId: string, result: ReviewRecord['result'], source: ReviewRecord['source'], quizMode?: ReviewRecord['quizMode']): string | null => {
      if (!db) return null

      const currentItem = getAllItems(db).find((i) => i.id === itemId)
      if (!currentItem) return null

      // 1. Create and insert review record
      const record: ReviewRecord = {
        id: crypto.randomUUID(),
        itemId,
        result,
        source,
        quizMode,
        reviewedAt: new Date().toISOString(),
        duration: 0,
      }
      dbAddReviewRecord(db, record)

      // 2. Compute updated mastery and next review date
      const newMastery = updateMastery(currentItem.mastery, result)
      const newNextReview = calculateNextReviewDate(newMastery, result)

      // 3. Update learning item
      updateItemMastery(db, itemId, newMastery, newNextReview)

      // 4. Check graduation: if quiz correct, check all three modes passed
      let graduatedWord: string | null = null
      if (source === 'quiz' && result === 'correct') {
        if (hasPassedAllQuizModes(db, itemId)) {
          archiveItem(db, itemId)
          graduatedWord = currentItem.word
        }
      }

      // 5. Reload state
      setItems(getAllItems(db))
      setReviewRecords(getAllReviewRecords(db))

      // 6. Persist
      persistDatabase(db)

      return graduatedWord
    },
    [db],
  )

  const updateSettings = useCallback(
    (s: Partial<Settings>) => {
      if (!db) return
      const merged = { ...settings, ...s }
      for (const [key, value] of Object.entries(merged)) {
        updateSettingValue(db, key, String(value))
      }
      setSettings(merged)
      persistDatabase(db)
    },
    [db, settings],
  )

  const dueItems = useCallback(() => getDueItems(items), [items])
  const dueCount = useCallback(() => getDueCount(items), [items])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <LearningDataContext.Provider
      value={{
        items,
        reviewRecords,
        settings,
        addItems,
        removeItem,
        recordReview,
        updateSettings,
        getDueItems: dueItems,
        getDueCount: dueCount,
      }}
    >
      {children}
    </LearningDataContext.Provider>
  )
}

export function useLearningData() {
  const ctx = useContext(LearningDataContext)
  if (!ctx) throw new Error('useLearningData must be used within LearningDataProvider')
  return ctx
}
