import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useLearningData } from '../contexts/LearningDataContext'
import LearningText from '../components/LearningText'

export default function Home() {
  const navigate = useNavigate()
  const { items, getDueCount } = useLearningData()

  const reviewCount = getDueCount()
  const recentLearnings = [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
  const todayExpression = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="pt-6 pb-2">
        <h1 className="jp-text text-[26px] font-semibold text-text-main mb-2">
          こんにちは
        </h1>
        <p className="jp-text text-[14px] text-text-muted">
          今日も一緒にビジネス日本語を学びましょう
        </p>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Review */}
        <button
          onClick={() => navigate('/review')}
          className="bg-white rounded-2xl border border-border p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <p className="jp-text text-[13px] text-text-muted mb-1">今日の復習</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[32px] font-bold text-primary leading-none">
              {reviewCount}
            </span>
            <span className="text-[13px] text-text-muted"><span className="jp-text">件</span>待复习</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] text-text-light group-hover:text-primary transition-colors mt-3">
            开始复习 <ArrowRight size={11} />
          </span>
        </button>

        {/* AI Analyze shortcut */}
        <button
          onClick={() => navigate('/analyze')}
          className="bg-white rounded-2xl border border-border p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <p className="text-[13px] text-text-muted mb-1">AI解析</p>
          <p className="text-[15px] font-medium text-text-main">
            分析商务日语
          </p>
          <p className="text-[12px] text-text-muted mt-1">输入任意内容，AI 深度解析</p>
          <span className="inline-flex items-center gap-1 text-[12px] text-text-light group-hover:text-primary transition-colors mt-3">
            开始分析 <ArrowRight size={11} />
          </span>
        </button>
      </div>

      {/* Recent Learning */}
      <div>
        <h2 className="jp-text text-[15px] font-medium text-text-main mb-3">
          最近の学習
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentLearnings.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate('/analyze', { state: { inputText: item.word } })}
              className="bg-white rounded-2xl border border-border p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <LearningText
                text={item.word}
                reading={item.reading}
                ruby={item.ruby}
                className="text-[16px] text-text-main"
              />
              <p className="text-[13px] text-text-muted mt-1.5">{item.meaning}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Business Expression */}
      {todayExpression && (
        <div>
          <h2 className="jp-text text-[15px] font-medium text-text-main mb-3">
            今日のビジネス表現
          </h2>
          <div className="bg-white rounded-2xl p-5 border border-border">
            <div className="mb-3">
              <LearningText
                text={todayExpression.word}
                reading={todayExpression.reading}
                ruby={todayExpression.ruby}
                className="text-[18px] text-text-main"
              />
            </div>
            <p className="text-[14px] text-text-body mb-3">
              {todayExpression.meaning}
            </p>
            <div className="bg-card rounded-xl p-3">
              <p className="jp-text text-[13px] text-text-body leading-relaxed">
                {todayExpression.example}
              </p>
              <p className="text-[12px] text-text-muted mt-1">
                {todayExpression.exampleMeaning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
