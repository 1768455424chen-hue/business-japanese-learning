import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Check, X, ArrowRight } from 'lucide-react'
import { useAIProvider } from '../contexts/AIProviderContext'
import { useLearningData } from '../contexts/LearningDataContext'
import type { LearningItem, QuizQuestion, ReviewRecord } from '../types'

type QuizState = 'idle' | 'generating' | 'active' | 'finished'
type QuizType = 'choice' | 'fill' | 'judgment'

const quizTypes: { key: QuizType; label: string; desc: string }[] = [
  { key: 'choice', label: '選択問題', desc: '从四个选项中选择正确答案' },
  { key: 'fill', label: '穴埋め問題', desc: '根据提示填写空缺部分' },
  { key: 'judgment', label: '判断問題', desc: '判断单词在例句中的用法是否正确' },
]

const questionTypeLabels: Record<string, string> = {
  choice: '選択問題',
  fill: '穴埋め問題',
  judgment: '判断問題',
}

function getQuizCandidates(
  items: LearningItem[],
  reviewRecords: ReviewRecord[],
  mode: QuizType,
): LearningItem[] {
  return items.filter((i) => {
    if (i.archived || i.mastery !== 'PROFICIENT') return false
    const passed = reviewRecords.some(
      (r) => r.itemId === i.id && r.source === 'quiz' && r.quizMode === mode && r.result === 'correct',
    )
    return !passed
  })
}

export default function Quiz() {
  const navigate = useNavigate()
  const aiProvider = useAIProvider()
  const { items, reviewRecords, recordReview } = useLearningData()
  const [state, setState] = useState<QuizState>('idle')
  const [selectedType, setSelectedType] = useState<QuizType>('choice')
  const [currentQ, setCurrentQ] = useState(0)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [fillAnswer, setFillAnswer] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [newlyGraduated, setNewlyGraduated] = useState<string[]>([])

  const choiceCandidates = getQuizCandidates(items, reviewRecords, 'choice')
  const fillCandidates = getQuizCandidates(items, reviewRecords, 'fill')
  const judgmentCandidates = getQuizCandidates(items, reviewRecords, 'judgment')

  const modeCounts: Record<QuizType, number> = {
    choice: choiceCandidates.length,
    fill: fillCandidates.length,
    judgment: judgmentCandidates.length,
  }

  const handleGenerate = async () => {
    const modeCandidates =
      selectedType === 'choice' ? choiceCandidates
      : selectedType === 'fill' ? fillCandidates
      : judgmentCandidates

    if (modeCandidates.length === 0) return

    setState('generating')
    const generated = await aiProvider.generateQuiz(modeCandidates.slice(0, 10), selectedType, modeCandidates.slice(0, 10).length)
    setQuestions(generated.length > 0 ? generated : [])
    setState('active')
    setCurrentQ(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setFillAnswer('')
    setCorrectCount(0)
    setIncorrectCount(0)
    setNewlyGraduated([])
  }

  const handleAnswer = (judgmentValue?: 'true' | 'false') => {
    const correct =
      question?.type === 'fill'
        ? fillAnswer.trim() === question.answer
        : question?.type === 'judgment'
          ? judgmentValue === question.answer
          : selectedAnswer === question?.answer

    setShowResult(true)

    if (correct) {
      setCorrectCount((c) => c + 1)
    } else {
      setIncorrectCount((c) => c + 1)
    }

    if (question) {
      const sourceItem = items.find((i) => i.word === question.source)
      if (sourceItem) {
        const graduatedWord = recordReview(
          sourceItem.id,
          correct ? 'correct' : 'incorrect',
          'quiz',
          selectedType,
        )
        if (graduatedWord) {
          setNewlyGraduated((prev) =>
            prev.includes(graduatedWord) ? prev : [...prev, graduatedWord],
          )
        }
      }
    }
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((i) => i + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setFillAnswer('')
    } else {
      setState('finished')
    }
  }

  const handleExit = () => {
    setState('idle')
    setQuestions([])
    setCurrentQ(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setFillAnswer('')
    setCorrectCount(0)
    setIncorrectCount(0)
    setNewlyGraduated([])
  }

  const question = questions[currentQ]
  const isCorrect =
    question?.type === 'fill'
      ? fillAnswer.trim() === question.answer
      : question?.type === 'judgment'
        ? selectedAnswer === question?.answer
        : selectedAnswer === question?.answer

  // ===== Empty state =====
  if (state === 'idle' && items.filter((i) => !i.archived && i.mastery === 'PROFICIENT').length === 0) {
    return (
      <div className="space-y-8 max-w-[520px]">
        <div>
          <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">AIテスト</h1>
          <p className="text-[13px] text-text-muted">AI 根据学习内容自动生成测验题目</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 text-center">
          <p className="jp-text text-[15px] text-text-body leading-relaxed mb-2">
            今はAIテストに進める単語がありません。
          </p>
          <p className="jp-text text-[13px] text-text-muted leading-relaxed mb-6">
            まずは復習で「覚えた」を重ねて、テストに挑戦できる単語を育てましょう。
          </p>
          <button
            onClick={() => navigate('/review')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:bg-primary-deep transition-colors"
          >
            復習に行く
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  // ===== Idle: type selection =====
  if (state === 'idle') {
    return (
      <div className="space-y-8 max-w-[520px]">
        <div>
          <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">AIテスト</h1>
          <p className="text-[13px] text-text-muted">AI 根据学习内容自动生成测验题目</p>
        </div>

        <div>
          <h2 className="jp-text text-[15px] font-medium text-text-main mb-3">問題タイプ</h2>
          <div className="grid gap-3">
            {quizTypes.map((t) => {
              const cnt = modeCounts[t.key]
              const disabled = cnt === 0
              return (
                <button
                  key={t.key}
                  onClick={() => !disabled && setSelectedType(t.key)}
                  disabled={disabled}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    disabled
                      ? 'border-border bg-gray-50 opacity-50 cursor-not-allowed'
                      : selectedType === t.key
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-white hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="jp-text text-[14px] font-medium text-text-main">{t.label}</span>
                      <span className="text-[12px] text-text-muted ml-3">{t.desc}</span>
                    </div>
                    <span className={`jp-text text-[12px] flex-shrink-0 ml-3 ${disabled ? 'text-text-light' : 'text-text-muted'}`}>
                      {disabled ? '対象 0 件' : `対象 ${cnt} 件`}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={modeCounts[selectedType] === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:bg-primary-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={15} />
          <span className="jp-text">テスト開始</span>
        </button>
      </div>
    )
  }

  // ===== Generating =====
  if (state === 'generating') {
    return (
      <div className="max-w-[520px] text-center pt-16">
        <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">AIテスト</h1>
        <div className="mt-12 space-y-2">
          <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-text-muted mt-4">AI 正在出题...</p>
        </div>
      </div>
    )
  }

  // ===== Finished =====
  if (state === 'finished') {
    const total = questions.length
    return (
      <div className="max-w-[520px] mx-auto pt-8 space-y-6">
        {/* Main result */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
            <span className="text-xl">🎉</span>
          </div>
          <h2 className="jp-text text-[22px] font-semibold text-text-main mb-2">テスト完了！</h2>
          <p className="jp-text text-[15px] text-text-body">
            {total}問中 {correctCount}問正解しました。
          </p>
          <p className="jp-text text-[13px] text-text-muted mt-1">
            正解 {correctCount} ・ 不正解 {incorrectCount}
          </p>
        </div>

        {/* Graduation card */}
        {newlyGraduated.length > 0 && (
          <div className="bg-primary-light rounded-2xl p-5">
            <p className="jp-text text-[14px] font-medium text-primary mb-2">
              おめでとうございます！
            </p>
            <p className="jp-text text-[13px] text-text-body mb-3">
              今回、以下の単語を完全に習得しました。
            </p>
            <ul className="space-y-1">
              {newlyGraduated.map((word) => (
                <li key={word} className="text-[15px] font-medium text-text-main">
                  ・{word}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="text-center pt-2">
          <button
            onClick={() => setState('idle')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-medium text-primary bg-white border-2 border-primary hover:bg-primary-light transition-colors"
          >
            <span className="jp-text">AIテストに戻る</span>
          </button>
          <button
            onClick={() => navigate('/notebook')}
            className="block mx-auto mt-3 text-[13px] text-text-muted hover:text-text-body transition-colors"
          >
            学習本を見る
          </button>
        </div>
      </div>
    )
  }

  // ===== No questions edge case =====
  if (questions.length === 0) {
    return (
      <div className="max-w-[520px] text-center pt-16">
        <p className="jp-text text-[15px] text-text-body mb-4">問題を生成できませんでした。</p>
        <button
          onClick={handleExit}
          className="text-[14px] text-primary hover:text-primary-deep transition-colors"
        >
          戻る
        </button>
      </div>
    )
  }

  // ===== Active =====
  return (
    <div className="max-w-[580px] space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">AIテスト</h1>
          <p className="text-[13px] text-text-muted">
            {currentQ + 1} / {questions.length}
          </p>
        </div>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
        >
          <X size={14} />
          <span className="jp-text">終了</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-card overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-border p-6">
        {/* Type badge */}
        <span className="jp-text text-[11px] font-medium text-text-muted mb-4 inline-block">
          {questionTypeLabels[question.type] ?? question.type}
        </span>

        {/* Question text */}
        <h3 className="jp-text text-[16px] font-medium text-text-main mb-6 leading-relaxed whitespace-pre-line">
          {question.question}
        </h3>

        {/* Choice */}
        {question.type === 'choice' && question.options && (
          <div className="space-y-2.5">
            {question.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = selectedAnswer === opt
              const isRevealed = showResult
              const isCorrectOpt = opt === question.answer

              let borderClass = 'border-border'
              if (isRevealed) {
                if (isCorrectOpt) borderClass = 'border-primary bg-primary-light'
                else if (isSelected && !isCorrectOpt) borderClass = 'border-danger/40 bg-red-50'
              } else if (isSelected) {
                borderClass = 'border-primary bg-primary-light'
              }

              return (
                <button
                  key={opt}
                  onClick={() => !showResult && setSelectedAnswer(opt)}
                  disabled={showResult}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[14px] transition-colors ${borderClass}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-card flex items-center justify-center text-[12px] font-medium text-text-muted flex-shrink-0">
                    {letter}
                  </span>
                  <span className="text-text-body flex-1">{opt}</span>
                  {isRevealed && isCorrectOpt && (
                    <Check size={16} className="text-primary flex-shrink-0" />
                  )}
                  {isRevealed && isSelected && !isCorrectOpt && (
                    <X size={16} className="text-danger flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Fill */}
        {question.type === 'fill' && (
          <div>
            <input
              type="text"
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              disabled={showResult}
              placeholder="答えを入力..."
              className="w-full px-4 py-3 rounded-xl border border-border text-[15px] text-text-main placeholder:text-text-light bg-transparent outline-none focus:border-primary/40"
            />
            {showResult && (
              <div className={`jp-text mt-3 p-3 rounded-xl text-[14px] ${isCorrect ? 'bg-primary-light text-primary' : 'bg-red-50 text-danger'}`}>
                {isCorrect ? '✓ 正解！' : `✗ 正解：${question.answer}`}
              </div>
            )}
          </div>
        )}

        {/* Judgment */}
        {question.type === 'judgment' && (
          <div>
            {!showResult ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedAnswer('true')
                    handleAnswer('true')
                  }}
                  className="flex-1 px-5 py-3.5 rounded-xl border-2 border-border text-[15px] font-medium text-text-body hover:border-primary hover:bg-primary-light transition-colors"
                >
                  正しい
                </button>
                <button
                  onClick={() => {
                    setSelectedAnswer('false')
                    handleAnswer('false')
                  }}
                  className="flex-1 px-5 py-3.5 rounded-xl border-2 border-border text-[15px] font-medium text-text-body hover:border-danger/40 hover:bg-red-50 transition-colors"
                >
                  間違っている
                </button>
              </div>
            ) : (
              <div
                className={`jp-text p-4 rounded-xl text-[14px] ${
                  isCorrect ? 'bg-primary-light text-primary' : 'bg-red-50 text-danger'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isCorrect ? (
                    <>
                      <Check size={16} />
                      <span className="font-medium">正解！</span>
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      <span className="font-medium">
                        不正解 — 正しい答えは「{question.answer === 'true' ? '正しい' : '間違っている'}」です
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {showResult && (
          <div className="mt-5 bg-card rounded-xl p-4">
            <h4 className="jp-text text-[12px] font-medium text-text-muted mb-2">解説</h4>
            <p className="jp-text text-[14px] text-text-body leading-relaxed whitespace-pre-line">
              {question.explanation
                ?? (() => {
                  const src = items.find((i) => i.word === question.source)
                  if (src) {
                    const parts: string[] = []
                    if (src.reading && src.reading !== src.word) {
                      parts.push(`「${src.word}」は「${src.reading}」と読み、意味は「${src.meaning}」です。`)
                    } else {
                      parts.push(`「${src.word}」は「${src.meaning}」という意味です。`)
                    }
                    if (src.example) {
                      parts.push(`例：${src.example}`)
                    }
                    return parts.join('\n')
                  }
                  return `正解：${question.answer}`
                })()}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end mt-6 pt-4 border-t border-border">
          {!showResult ? (
            <button
              onClick={() => handleAnswer()}
              disabled={
                (question.type === 'choice' && !selectedAnswer) ||
                (question.type === 'fill' && !fillAnswer.trim())
              }
              className="px-6 py-2 bg-primary text-white rounded-xl text-[14px] font-medium hover:bg-primary-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              回答
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-white rounded-xl text-[14px] font-medium hover:bg-primary-deep transition-colors"
            >
              {currentQ < questions.length - 1 ? '次の問題' : '完了'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
