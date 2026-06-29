import { useState, useRef } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { useLearningData } from '../contexts/LearningDataContext'
import LearningText from '../components/LearningText'
import type { LearningItem } from '../types'

export default function Review() {
  const { getDueItems, recordReview } = useLearningData()
  const [isStarted, setIsStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberedCount, setRememberedCount] = useState(0)
  const [forgottenCount, setForgottenCount] = useState(0)

  // Session snapshot: immutable during an active review session.
  // Prevents the list from shrinking mid-session when recordReview()
  // updates nextReviewDate, which would otherwise cause currentIndex
  // to go out of bounds and crash the component.
  const [sessionItems, setSessionItems] = useState<LearningItem[]>([])
  // Track whether we've started review at least once, to know when
  // the snapshot is valid (avoid stale snapshot from a prior session).
  const hasSessionSnapshot = useRef(false)

  // For the "not started" view, still use live getDueItems() so the
  // count and list reflect the current DB state.
  const reviewItems = getDueItems()
  // During active review, use the session snapshot.
  const current = hasSessionSnapshot.current ? sessionItems[currentIndex] : undefined

  const handleStart = () => {
    const snapshot = getDueItems()
    setSessionItems(snapshot)
    hasSessionSnapshot.current = true
    setIsStarted(true)
    setCurrentIndex(0)
    setShowMeaning(false)
    setIsComplete(false)
    setRememberedCount(0)
    setForgottenCount(0)
  }

  const handleAnswer = (result: 'correct' | 'incorrect') => {
    if (isSubmitting) return
    setIsSubmitting(true)

    if (result === 'correct') {
      setRememberedCount((c) => c + 1)
    } else {
      setForgottenCount((c) => c + 1)
    }

    const activeItems = hasSessionSnapshot.current ? sessionItems : []
    const currentItem = activeItems[currentIndex]

    if (currentItem) {
      recordReview(currentItem.id, result, 'review')
    }

    if (currentIndex < activeItems.length - 1) {
      setCurrentIndex((i) => i + 1)
      setShowMeaning(false)
      setIsSubmitting(false)
    } else {
      setIsComplete(true)
      setIsSubmitting(false)
    }
  }

  const handleExit = () => {
    hasSessionSnapshot.current = false
    setSessionItems([])
    setIsStarted(false)
    setCurrentIndex(0)
    setShowMeaning(false)
    setIsComplete(false)
    setRememberedCount(0)
    setForgottenCount(0)
  }

  // Not started
  if (!isStarted) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">今日の復習</h1>
          <p className="text-[13px] text-text-muted">巩固你今天学过的内容</p>
        </div>

        <div>
          <h2 className="text-[15px] font-medium text-text-main mb-3">
            <span className="jp-text">今日の復習リスト</span> · {reviewItems.length} <span className="jp-text">件</span>
          </h2>
          {reviewItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <p className="text-[14px] text-text-muted">暂无待复习内容</p>
              <p className="text-[12px] text-text-light mt-1">去 AI解析 添加新的学习内容吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {reviewItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-border px-4 py-3"
                >
                  <LearningText
                    text={item.word}
                    reading={item.reading}
                    ruby={item.ruby}
                    className="text-[15px] text-text-main"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {reviewItems.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-[15px] font-medium hover:bg-primary-deep transition-colors"
            >
              <span className="jp-text">復習を始める</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Complete
  if (isComplete) {
    return (
      <div className="text-center pt-16">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-light flex items-center justify-center">
          <span className="text-2xl">🎉</span>
        </div>
        <h2 className="jp-text text-[20px] font-semibold text-text-main mb-2">復習完了！</h2>
        <div className="text-[14px] text-text-muted mb-8 space-y-1">
          <p><span className="jp-text">覚えた</span>：{rememberedCount} 条</p>
          <p><span className="jp-text">忘れた</span>：{forgottenCount} 条</p>
        </div>
        <button
          onClick={() => setIsStarted(false)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-medium text-primary border-2 border-primary hover:bg-primary-light transition-colors"
        >
          返回列表
        </button>
      </div>
    )
  }

  // Review card (active session)
  // Guard: if session snapshot is empty or current item is missing, bail out gracefully.
  if (!current) {
    return (
      <div className="text-center pt-16">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-light flex items-center justify-center">
          <span className="text-2xl">📭</span>
        </div>
        <h2 className="jp-text text-[20px] font-semibold text-text-main mb-2">復習完了</h2>
        <p className="text-[14px] text-text-muted mb-8">暂无待复习内容</p>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-medium text-primary border-2 border-primary hover:bg-primary-light transition-colors"
        >
          返回列表
        </button>
      </div>
    )
  }

  const totalCount = sessionItems.length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">今日の復習</h1>
          <p className="text-[13px] text-text-muted">
            {currentIndex + 1} / {totalCount}
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

      <div className="w-full h-1.5 rounded-full bg-card overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
        />
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-border p-10 relative">
          <button
            onClick={() => setShowMeaning(!showMeaning)}
            className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text-body hover:bg-card transition-colors"
          >
            {showMeaning ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          <div className="text-center pt-4">
            <LearningText
              text={current.word}
              reading={current.reading}
              ruby={current.ruby}
              className="text-[24px] text-text-main"
            />
          </div>

          {showMeaning && (
            <div className="mt-5 bg-card rounded-xl p-4 text-left">
              <p className="text-[15px] font-medium text-text-main">{current.meaning}</p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="jp-text text-[13px] text-text-body">{current.example}</p>
                <p className="text-[12px] text-text-muted mt-1">{current.exampleMeaning}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleAnswer('incorrect')}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[13px] font-medium border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="jp-text">忘れた</span>
        </button>
        <button
          onClick={() => handleAnswer('correct')}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[13px] font-medium bg-primary text-white hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="jp-text">覚えた</span>
        </button>
      </div>
    </div>
  )
}
