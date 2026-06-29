import type { Database } from 'sql.js'
import type { LearningItem, ReviewRecord, Settings } from '../types'

// ===== Learning Items =====

function rowToItem(row: Record<string, unknown>): LearningItem {
  return {
    id: String(row.id),
    word: String(row.word),
    reading: String(row.reading),
    ruby: row.ruby ? JSON.parse(String(row.ruby)) : undefined,
    meaning: String(row.meaning),
    partOfSpeech: String(row.part_of_speech),
    category: String(row.category) as LearningItem['category'],
    example: String(row.example),
    exampleMeaning: String(row.example_meaning),
    sourceSentence: row.source_sentence ? String(row.source_sentence) : null,
    source: String(row.source) as LearningItem['source'],
    mastery: String(row.mastery) as LearningItem['mastery'],
    nextReviewDate: String(row.next_review_date),
    createdAt: String(row.created_at),
    archived: Number(row.archived) === 1,
  }
}

export function getAllItems(db: Database): LearningItem[] {
  const results = db.exec('SELECT * FROM learning_items ORDER BY created_at DESC')
  if (!results || results.length === 0) return []

  const { columns, values } = results[0]
  return values.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      obj[col] = row[i]
    })
    return rowToItem(obj)
  })
}

export function addItems(db: Database, items: LearningItem[]): { inserted: number; skipped: number } {
  // Count rows before insert
  const beforeResult = db.exec('SELECT COUNT(*) as cnt FROM learning_items')
  const before = beforeResult.length > 0 ? (beforeResult[0].values[0][0] as number) : 0

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO learning_items
      (id, word, reading, ruby, meaning, part_of_speech, category,
       example, example_meaning, source_sentence, source,
       mastery, next_review_date, created_at, archived)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const item of items) {
    stmt.run([
      item.id,
      item.word,
      item.reading,
      item.ruby ? JSON.stringify(item.ruby) : null,
      item.meaning,
      item.partOfSpeech,
      item.category,
      item.example,
      item.exampleMeaning,
      item.sourceSentence,
      item.source,
      item.mastery,
      item.nextReviewDate,
      item.createdAt,
      item.archived ? 1 : 0,
    ])
  }
  stmt.free()

  // Count rows after insert to detect how many were actually inserted
  const afterResult = db.exec('SELECT COUNT(*) as cnt FROM learning_items')
  const after = afterResult.length > 0 ? (afterResult[0].values[0][0] as number) : 0
  const inserted = after - before
  const skipped = items.length - inserted

  if (import.meta.env.DEV) {
    console.debug(`[addItems] ${inserted} inserted, ${skipped} skipped (duplicate word+reading)`)
  }
  return { inserted, skipped }
}

export function removeItem(db: Database, id: string): void {
  // Hard delete: cascade delete review_history first, then the item itself.
  // This ensures the UNIQUE(word, reading) constraint no longer blocks re-adding the same word.
  db.run('DELETE FROM review_history WHERE item_id = ?', [id])
  db.run('DELETE FROM learning_items WHERE id = ?', [id])
}

export function updateItemMastery(
  db: Database,
  id: string,
  mastery: string,
  nextReviewDate: string
): void {
  db.run(
    'UPDATE learning_items SET mastery = ?, next_review_date = ? WHERE id = ?',
    [mastery, nextReviewDate, id]
  )
}

export function archiveItem(db: Database, id: string): void {
  db.run('UPDATE learning_items SET archived = 1 WHERE id = ?', [id])
}

// ===== Repair polluted word fields =====
// Scans all learning_items for word fields matching "Japanese（Chinese）" pattern,
// splits them into clean word + meaning, and updates the DB in place.
// Returns count of repaired items.
const PLACEHOLDER_MEANINGS = new Set([
  '类似表达', '商务表达・其他', 'その他', 'business expression', 'similar expression', '',
])

export function repairPollutedItems(db: Database): number {
  const allItems = getAllItems(db)
  let repaired = 0

  for (const item of allItems) {
    const match = item.word.match(/^(.+?)（(.+?)）$/)
    if (!match) continue

    const cleanWord = match[1].trim()
    const extractedMeaning = match[2].trim()

    // Check if a clean item with same (word, reading) already exists
    const existing = db.exec(
      'SELECT id FROM learning_items WHERE word = ? AND reading = ? AND id != ?',
      [cleanWord, item.reading, item.id],
    )

    if (existing.length > 0 && existing[0].values.length > 0) {
      // Dedup: clean item already exists — delete this polluted one
      db.run('DELETE FROM review_history WHERE item_id = ?', [item.id])
      db.run('DELETE FROM learning_items WHERE id = ?', [item.id])
    } else {
      // Update in place: fix word, optionally fix meaning
      const newMeaning = PLACEHOLDER_MEANINGS.has(item.meaning)
        ? extractedMeaning
        : item.meaning

      db.run(
        'UPDATE learning_items SET word = ?, meaning = ? WHERE id = ?',
        [cleanWord, newMeaning, item.id],
      )
    }

    repaired++
  }

  return repaired
}

// Check if an item has passed all three quiz modes (choice, fill, judgment).
// Returns true if the item should graduate.
export function hasPassedAllQuizModes(db: Database, itemId: string): boolean {
  const results = db.exec(
    `SELECT DISTINCT quiz_mode FROM review_history
     WHERE item_id = ? AND source = 'quiz' AND result = 'correct' AND quiz_mode IS NOT NULL`,
    [itemId]
  )
  if (!results || results.length === 0) return false
  const modes = new Set(results[0].values.map((row) => String(row[0])))
  return modes.has('choice') && modes.has('fill') && modes.has('judgment')
}

// ===== Review History =====

function rowToReviewRecord(row: Record<string, unknown>): ReviewRecord {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    result: String(row.result) as ReviewRecord['result'],
    source: String(row.source) as ReviewRecord['source'],
    quizMode: row.quiz_mode ? String(row.quiz_mode) as ReviewRecord['quizMode'] : undefined,
    reviewedAt: String(row.reviewed_at),
    duration: Number(row.duration),
  }
}

export function getAllReviewRecords(db: Database): ReviewRecord[] {
  const results = db.exec('SELECT * FROM review_history ORDER BY reviewed_at DESC')
  if (!results || results.length === 0) return []

  const { columns, values } = results[0]
  return values.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      obj[col] = row[i]
    })
    return rowToReviewRecord(obj)
  })
}

export function addReviewRecord(db: Database, record: ReviewRecord): void {
  const stmt = db.prepare(`
    INSERT INTO review_history (id, item_id, result, source, quiz_mode, reviewed_at, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run([
    record.id,
    record.itemId,
    record.result,
    record.source,
    record.quizMode ?? null,
    record.reviewedAt,
    record.duration,
  ])
  stmt.free()
}

// ===== Settings =====

export function getAllSettings(db: Database): Settings {
  const results = db.exec('SELECT key, value FROM settings')
  const map: Record<string, string> = {}

  if (results && results.length > 0) {
    const { values } = results[0]
    for (const row of values) {
      map[String(row[0])] = String(row[1])
    }
  }

  return {
    provider: map['provider'] || 'mock',
    providerPreset: map['providerPreset'] || 'mock',
    model: map['model'] || '',
    apiKey: map['apiKey'] || '',
    baseUrl: map['baseUrl'] || '',
    temperature: map['temperature'] ? parseFloat(map['temperature']) : 0.2,
    language: map['language'] || 'zh',
  }
}

export function updateSettingValue(db: Database, key: string, value: string): void {
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
}
