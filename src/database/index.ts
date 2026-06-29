import initSqlJs, { type Database } from 'sql.js'
import { seedLearningItems, seedReviewRecords } from '../mock/learningItems'

// ===== Constants =====
const DB_STORAGE_KEY = 'business-japanese-skill-db'
const DEFAULT_SETTINGS: Record<string, string> = {
  provider: 'mock',
  providerPreset: 'mock',
  model: '',
  apiKey: '',
  baseUrl: '',
  temperature: '0.2',
  language: 'zh',
}

let dbInstance: Database | null = null

// ===== Base64 helpers =====
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += 4096) {
    chunks.push(String.fromCharCode(...bytes.slice(i, i + 4096)))
  }
  return btoa(chunks.join(''))
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ===== Schema =====
function createTables(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS learning_items (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      reading TEXT NOT NULL,
      ruby TEXT,
      meaning TEXT NOT NULL,
      part_of_speech TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('word','grammar','expression')),
      example TEXT NOT NULL,
      example_meaning TEXT NOT NULL,
      source_sentence TEXT,
      source TEXT NOT NULL CHECK(source IN ('manual','ai-analysis')),
      mastery TEXT NOT NULL CHECK(mastery IN ('RECOGNIZE','CAN_USE','PROFICIENT')),
      next_review_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      UNIQUE(word, reading)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS review_history (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('correct','incorrect','skip')),
      source TEXT NOT NULL CHECK(source IN ('review','quiz')),
      quiz_mode TEXT CHECK(quiz_mode IN ('choice','fill','judgment')),
      reviewed_at TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (item_id) REFERENCES learning_items(id)
    )
  `)

  // Inline migration: add quiz_mode column to existing review_history tables
  try {
    db.run('ALTER TABLE review_history ADD COLUMN quiz_mode TEXT')
  } catch {
    // Column already exists — ignore
  }

  // Ensure quiz_mode CHECK constraint accepts 'judgment'.
  // SQLite cannot ALTER CHECK constraints, so we test by inserting a probe row.
  // If the old CHECK (choice,fill,correction) is still in place, rebuild the table.
  let checkOk = false
  try {
    db.run("INSERT INTO review_history (id, item_id, result, source, quiz_mode, reviewed_at, duration) VALUES ('__mig_ck__', 'seed-1', 'correct', 'quiz', 'judgment', '2026-01-01', 0)")
    db.run("DELETE FROM review_history WHERE id = '__mig_ck__'")
    checkOk = true
  } catch {
    // Old CHECK constraint blocks 'judgment' — rebuild needed
  }

  if (!checkOk) {
    // Rebuild review_history with updated CHECK constraint, preserving all data
    db.run(`
      CREATE TABLE review_history_new (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        result TEXT NOT NULL CHECK(result IN ('correct','incorrect','skip')),
        source TEXT NOT NULL CHECK(source IN ('review','quiz')),
        quiz_mode TEXT CHECK(quiz_mode IN ('choice','fill','judgment')),
        reviewed_at TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES learning_items(id)
      )
    `)
    db.run(`
      INSERT INTO review_history_new (id, item_id, result, source, quiz_mode, reviewed_at, duration)
      SELECT id, item_id, result, source,
        CASE WHEN quiz_mode = 'correction' THEN 'judgment' ELSE quiz_mode END,
        reviewed_at, duration
      FROM review_history
    `)
    db.run('DROP TABLE review_history')
    db.run('ALTER TABLE review_history_new RENAME TO review_history')
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
}

// ===== Seed =====
function seedData(db: Database): void {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO learning_items
      (id, word, reading, ruby, meaning, part_of_speech, category,
       example, example_meaning, source_sentence, source,
       mastery, next_review_date, created_at, archived)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const item of seedLearningItems) {
    insertStmt.run([
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
  insertStmt.free()

  // Seed review_history for testing graduation mechanism
  const reviewStmt = db.prepare(`
    INSERT OR IGNORE INTO review_history
      (id, item_id, result, source, quiz_mode, reviewed_at, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (const record of seedReviewRecords) {
    reviewStmt.run([
      record.id,
      record.itemId,
      record.result,
      record.source,
      record.quizMode ?? null,
      record.reviewedAt,
      record.duration,
    ])
  }
  reviewStmt.free()

  // Seed default settings
  const settingsStmt = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  )
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    settingsStmt.run([key, value])
  }
  settingsStmt.free()
}

// ===== Persist =====
export function persistDatabase(db: Database): void {
  const buffer = db.export()
  const base64 = uint8ArrayToBase64(buffer)
  localStorage.setItem(DB_STORAGE_KEY, base64)
}

// ===== Initialize =====
export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance

  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  })

  const saved = localStorage.getItem(DB_STORAGE_KEY)
  if (saved) {
    const buffer = base64ToUint8Array(saved)
    dbInstance = new SQL.Database(buffer)
    // Ensure tables exist (schema migration safety)
    createTables(dbInstance)
    return dbInstance
  }

  dbInstance = new SQL.Database()
  createTables(dbInstance)
  seedData(dbInstance)
  persistDatabase(dbInstance)
  return dbInstance
}
