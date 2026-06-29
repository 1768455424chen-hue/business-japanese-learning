import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, Check, BookOpen, Square, CheckSquare, ChevronRight, Plus } from 'lucide-react'
import { useAIProvider } from '../contexts/AIProviderContext'
import { useLearningData } from '../contexts/LearningDataContext'
import type { AnalysisResult, LearningPoint } from '../types'
import LearningText from '../components/LearningText'
import DetailModal from '../components/DetailModal'

const loadingSteps = ['语汇分析', '文法解析', '固定搭配', '商务解释', '类似表现']

const categoryLabels: Record<string, string> = {
  word: '词汇',
  grammar: '文法',
  expression: '商务表达',
}

function makeLightPoint(word: string, extra?: Partial<LearningPoint>): LearningPoint {
  return {
    word,
    reading: extra?.reading ?? '',
    meaning: extra?.meaning ?? '',
    partOfSpeech: extra?.partOfSpeech ?? 'その他',
    category: extra?.category ?? 'expression',
    example: extra?.example ?? { ja: '', zh: '' },
    grammar: extra?.grammar ?? '',
    collocations: extra?.collocations ?? [],
    businessExplanation: extra?.businessExplanation ?? '',
    similarExpressions: [],
    components: extra?.components,
  }
}

function isLongInput(text: string): boolean {
  return text.length > 15 || /[。、？！\s]/.test(text)
}

const PLACEHOLDER_MEANINGS = new Set([
  '类似表达', '商务表达・その他', 'その他', '商务表达・其他',
  'business expression', 'similar expression', 'category',
  '词汇・动词', '词汇', '文法', '语法',
])

function hasJapanese(text: string): boolean {
  // Must contain at least one kana or kanji character
  return /[一-鿿ぁ-ゟァ-ヿ]/.test(text)
}

function isValidItem(item: LearningPoint, input: string): boolean {
  const word = (item.word ?? '').trim()
  if (!word) return false

  // Reject if word contains parenthesized pollution
  if (/[（(]/.test(word)) return false

  // Reject if word has no Japanese characters (e.g. pure Chinese or English)
  if (!hasJapanese(word)) return false

  // Reject if word equals the full sentence input (sentence not decomposed)
  if (isLongInput(input) && word === input.trim()) return false

  // Reject overly long "words" (likely undigested sentence fragments)
  if (word.length > 30) return false

  // Meaning must exist and not be a placeholder
  const meaning = (item.meaning ?? '').trim()
  if (!meaning) return false
  if (PLACEHOLDER_MEANINGS.has(meaning)) return false

  // Reading can be empty (kana-only words), but must have ruby for kanji words
  // Relaxed: allow items without reading/ruby (AI may omit for kana words)
  return true
}

// Card 1: compact browse card
function BrowseCard({
  item,
  selected,
  onToggle,
  onClick,
}: {
  item: LearningPoint
  selected: boolean
  onToggle: () => void
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-border p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group h-full"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <LearningText
            text={item.word}
            reading={item.reading}
            ruby={item.ruby}
            className="text-[16px] text-text-main"
          />
          <p className="text-[13px] text-text-muted mt-1">{item.meaning}</p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] bg-card text-text-muted">
            {categoryLabels[item.category] ?? item.category}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="text-text-muted hover:text-primary transition-colors"
          >
            {selected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
          </button>
          <ChevronRight size={16} className="text-text-light group-hover:text-text-muted transition-colors" />
        </div>
      </div>
    </div>
  )
}

// Card 2: full detail modal content
function DetailContent({
  item,
  isSecondary,
  status,
  onAddSingle,
  onNavigate,
}: {
  item: LearningPoint
  isSecondary: boolean
  status: 'in_notebook' | 'selected' | 'available'
  onAddSingle: () => void
  onNavigate: (point: LearningPoint) => void
}) {
  const showSimilar = !isSecondary && item.similarExpressions.length > 0
  const showComponents = !isSecondary && item.components && item.components.length > 0

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>
      {/* Title block */}
      <div className="flex-shrink-0 pb-4">
        <LearningText
          text={item.word}
          reading={item.reading}
          ruby={item.ruby}
          className="text-[22px] text-text-main"
        />
        <p className="text-[14px] text-text-muted mt-1">{item.meaning}</p>
        <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] bg-card text-text-muted">
          {categoryLabels[item.category] ?? item.category} · {item.partOfSpeech}
        </span>
      </div>

      {/* Body: scrollable sections */}
      <div className="space-y-5">
        {item.grammar && (
          <div>
            <h3 className="jp-text text-[12px] font-medium text-text-muted mb-2">文法</h3>
            <p className="text-[14px] text-text-body leading-relaxed">{item.grammar}</p>
          </div>
        )}

        {item.collocations.length > 0 && (
          <div>
            <h3 className="jp-text text-[12px] font-medium text-text-muted mb-2">よく使う組み合わせ</h3>
            <ul className="space-y-1">
              {item.collocations.map((c) => (
                <li key={c} className="text-[14px] text-text-body">· {c}</li>
              ))}
            </ul>
          </div>
        )}

        {item.businessExplanation && (
          <div>
            <h3 className="jp-text text-[12px] font-medium text-text-muted mb-2">ビジネス解説</h3>
            <p className="text-[14px] text-text-body leading-relaxed">{item.businessExplanation}</p>
          </div>
        )}

        {(item.example.ja || item.example.zh) && (
          <div>
            <h3 className="jp-text text-[12px] font-medium text-text-muted mb-2">例文</h3>
            <div className="bg-card rounded-xl p-3">
              <p className="jp-text text-[14px] text-text-body leading-relaxed">{item.example.ja}</p>
              {item.example.zh && (
                <p className="text-[12px] text-text-muted mt-1">{item.example.zh}</p>
              )}
            </div>
          </div>
        )}

        {showSimilar && (
          <div>
            <h3 className="jp-text text-[12px] font-medium text-text-muted mb-2">類似表現</h3>
            <div className="flex flex-wrap gap-2">
              {item.similarExpressions.map((s) => {
                const seWord = typeof s === 'string' ? s : s.word
                const seReading = typeof s === 'object' ? s.reading : undefined
                const seMeaning = typeof s === 'object' ? s.meaning : undefined

                return (
                  <button
                    key={seWord}
                    onClick={() =>
                      onNavigate(
                        makeLightPoint(seWord, {
                          reading: seReading ?? '',
                          meaning: seMeaning ?? '',
                        }),
                      )
                    }
                    className="jp-text px-3 py-1.5 rounded-full text-[13px] text-primary bg-primary-light hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    {seWord}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {showComponents && (
          <div>
            <h3 className="text-[12px] font-medium text-text-muted mb-2">拆出单独学习</h3>
            <div className="flex flex-wrap gap-2">
              {item.components!.map((c) => (
                <button
                  key={c.word}
                  onClick={() => onNavigate(c)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] text-primary border border-primary/30 hover:bg-primary-light transition-colors cursor-pointer"
                >
                  {c.word}
                  <Plus size={12} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer: action */}
      <div className="flex-shrink-0 mt-6 pt-4 border-t border-border">
        {!item.meaning ? (
          <span className="text-[12px] text-text-muted leading-relaxed">
            缺少释义，无法直接加入学习本。请单独对该表达进行 AI 解析后再添加。
          </span>
        ) : status === 'in_notebook' ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-text-muted">
            <Check size={14} />
            已在学习本中
          </span>
        ) : status === 'selected' ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-primary font-medium">
            <Check size={14} />
            已选择
          </span>
        ) : (
          <button
            onClick={onAddSingle}
            className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-primary-deep transition-colors font-medium cursor-pointer"
          >
            <BookOpen size={14} />
            加入学习本
          </button>
        )}
      </div>
    </div>
  )
}

export default function AIAnalyze() {
  const location = useLocation()
  const initialText = (location.state as { inputText?: string })?.inputText ?? ''

  const [input, setInput] = useState(initialText)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [addedToNotebook, setAddedToNotebook] = useState(false)
  const [addResult, setAddResult] = useState<{ inserted: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailStack, setDetailStack] = useState<LearningPoint[]>([])
  const aiProvider = useAIProvider()
  const { items: learningItems, addItems } = useLearningData()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (initialText) {
      handleAnalyze(initialText)
    }
  }, [])

  const handleAnalyze = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text) return

    setIsLoading(true)
    setResult(null)
    setError(null)
    setCurrentStep(0)
    setAddedToNotebook(false)
    setAddResult(null)
    setSelectedIds(new Set())
    setDetailStack([])

    loadingSteps.forEach((_, idx) => {
      setTimeout(() => {
        if (mountedRef.current) {
          setCurrentStep(idx + 1)
        }
      }, (idx + 1) * 200)
    })

    try {
      const analysisResult = await aiProvider.analyze(text)
      if (mountedRef.current) {
        // Filter out invalid items
        const validItems = analysisResult.items.filter((item) => isValidItem(item, text))
        if (validItems.length === 0 && analysisResult.items.length > 0) {
          setError('AI 返回的数据无效，请重试或更换输入。')
          setResult(null)
        } else {
          setResult({ ...analysisResult, items: validItems })
          setSelectedIds(new Set(validItems.map((_, i) => i)))
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '解析失败')
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
        setCurrentStep(0)
      }
    }
  }

  const toggleItem = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const selectAll = () => {
    if (!result) return
    setSelectedIds(new Set(result.items.map((_, i) => i)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const allSelected = result ? selectedIds.size === result.items.length : false

  const handleAddToNotebook = () => {
    if (!result || addedToNotebook) return
    const selectedPoints: LearningPoint[] = result.items.filter((_, i) => selectedIds.has(i))
    if (selectedPoints.length === 0) return
    const { inserted, skipped } = addItems(selectedPoints, result.input)
    setAddResult({ inserted, skipped })
    if (inserted > 0) {
      setAddedToNotebook(true)
    }
  }

  const handleAddSingle = (point: LearningPoint) => {
    addItems([point], result?.input ?? point.word)
  }

  const openDetail = (item: LearningPoint) => {
    setDetailStack([item])
  }

  const navigateDetail = (point: LearningPoint) => {
    setDetailStack((prev) => [...prev, point])
  }

  const goBack = () => {
    setDetailStack((prev) => prev.slice(0, -1))
  }

  const closeDetail = () => {
    setDetailStack([])
  }

  const detailItem = detailStack.length > 0 ? detailStack[detailStack.length - 1] : null
  const isSecondary = detailStack.length > 1

  const getDetailStatus = (item: LearningPoint): 'in_notebook' | 'selected' | 'available' => {
    if (learningItems.some((li) => li.word === item.word)) return 'in_notebook'
    if (result?.items.some((ri, i) => ri.word === item.word && selectedIds.has(i))) return 'selected'
    return 'available'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">AI解析</h1>
        <p className="text-[13px] text-text-muted">输入商务日语，AI 为你深度解析</p>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ビジネス日本語を入力してください"
          rows={3}
          className="jp-text w-full resize-none text-[15px] text-text-main placeholder:text-text-light bg-transparent outline-none leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAnalyze()
            }
          }}
        />

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[11px] text-text-light">试试：</span>
          {['営業利益', '検討する', '早速', '円滑に進める'].map((word) => (
            <button
              key={word}
              onClick={() => setInput(word)}
              className="jp-text px-3 py-1 rounded-full text-[12px] text-text-muted bg-card hover:bg-primary-light hover:text-primary transition-colors"
            >
              {word}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleAnalyze()}
          disabled={isLoading || !input.trim()}
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:bg-primary-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={15} />
          {isLoading ? '解析中...' : <span className="jp-text">解析する</span>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-[14px] text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="max-w-[400px] mx-auto space-y-3">
            {loadingSteps.map((step, idx) => (
              <div
                key={step}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  idx < currentStep
                    ? 'bg-primary-light text-primary'
                    : idx === currentStep
                    ? 'bg-card text-text-body'
                    : 'text-text-light'
                }`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center">
                  {idx < currentStep ? (
                    <Check size={14} className="text-primary" />
                  ) : idx === currentStep ? (
                    <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-text-light" />
                  )}
                </div>
                <span className="text-[13px] font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty items: unsupported input */}
      {result && !isLoading && result.items.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-8 text-center">
          <p className="text-[14px] text-text-body leading-relaxed mb-4">
            Mock 模式无法分析该输入。
            <br />
            请输入日语词汇 / 表达，或切换到真实 AI Provider。
          </p>
          <button
            onClick={() => {
              setInput('会議を円滑に進めるため、事前に資料を共有いたします。')
            }}
            className="text-[13px] text-primary hover:text-primary-deep transition-colors underline"
          >
            会議を円滑に進めるため、事前に資料を共有いたします。
          </button>
        </div>
      )}

      {/* Results with items */}
      {result && !isLoading && result.items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-text-main">
              分析结果（{result.items.length} 件）
            </h2>
            <button
              onClick={allSelected ? deselectAll : selectAll}
              className="text-[13px] text-primary hover:text-primary-deep transition-colors"
            >
              {allSelected ? '取消全选' : '全选'}
            </button>
          </div>

          {/* Card 1: grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.items.map((item, idx) => (
              <BrowseCard
                key={idx}
                item={item}
                selected={selectedIds.has(idx)}
                onToggle={() => toggleItem(idx)}
                onClick={() => openDetail(item)}
              />
            ))}
          </div>

          {/* Add to Notebook */}
          <div className="text-center">
            <button
              onClick={handleAddToNotebook}
              disabled={addedToNotebook || selectedIds.size === 0}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                addedToNotebook
                  ? 'bg-primary-light text-primary cursor-default'
                  : 'border-2 border-primary text-primary hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <BookOpen size={15} />
              {addedToNotebook
                ? '已添加到学習本'
                : selectedIds.size > 0
                ? `学習本に追加（${selectedIds.size}件）`
                : '学習本に追加'}
            </button>
            {addResult && addResult.skipped > 0 && (
              <p className="text-[12px] text-text-muted mt-2">
                {addResult.inserted > 0
                  ? `已添加 ${addResult.inserted} 条，${addResult.skipped} 条已存在`
                  : `${addResult.skipped} 条已存在，无需重复添加`}
              </p>
            )}
          </div>
        </>
      )}

      {/* Card 2: full detail modal */}
      <DetailModal
        open={detailItem !== null}
        onClose={closeDetail}
        wide
        backLabel={isSecondary ? '戻る' : undefined}
        onBack={isSecondary ? goBack : undefined}
      >
        {detailItem && (
          <DetailContent
            item={detailItem}
            isSecondary={isSecondary}
            status={getDetailStatus(detailItem)}
            onAddSingle={() => handleAddSingle(detailItem)}
            onNavigate={navigateDetail}
          />
        )}
      </DetailModal>
    </div>
  )
}
