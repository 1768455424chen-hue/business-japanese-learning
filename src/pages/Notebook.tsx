import { useState } from 'react'
import { X, Trash2, ChevronRight } from 'lucide-react'
import { useLearningData } from '../contexts/LearningDataContext'
import type { LearningItem } from '../types'
import LearningText from '../components/LearningText'
import DetailModal from '../components/DetailModal'

const masteryLabels: Record<string, string> = {
  RECOGNIZE: '认识',
  CAN_USE: '会用',
  PROFICIENT: '熟练',
}

const sourceLabels: Record<string, string> = {
  manual: '手动添加',
  'ai-analysis': 'AI解析',
}

const categoryLabels: Record<string, string> = {
  word: '词汇',
  grammar: '文法',
  expression: '商务表达',
}

function DetailContent({ item }: { item: LearningItem }) {
  return (
    <div>
      <LearningText
        text={item.word}
        reading={item.reading}
        ruby={item.ruby}
        className="text-[20px] text-text-main"
      />
      <p className="text-[14px] text-text-muted mt-1">{item.meaning}</p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-muted w-16 flex-shrink-0">词性</span>
          <span className="text-[13px] text-text-body">{item.partOfSpeech}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-muted w-16 flex-shrink-0">分类</span>
          <span className="text-[13px] text-text-body">{categoryLabels[item.category] ?? item.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-muted w-16 flex-shrink-0">熟练度</span>
          <span className="text-[13px] text-text-body">{masteryLabels[item.mastery] ?? item.mastery}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-muted w-16 flex-shrink-0">来源</span>
          <span className="text-[13px] text-text-body">{sourceLabels[item.source] ?? item.source}</span>
        </div>
        {item.sourceSentence && (
          <div>
            <span className="text-[12px] text-text-muted">原始句子</span>
            <p className="text-[13px] text-text-body mt-1 bg-card rounded-lg p-3 leading-relaxed">
              {item.sourceSentence}
            </p>
          </div>
        )}
        <div>
          <span className="jp-text text-[12px] text-text-muted">例文</span>
          <div className="bg-card rounded-xl p-3 mt-1">
            <p className="jp-text text-[13px] text-text-body leading-relaxed">{item.example}</p>
            <p className="text-[12px] text-text-muted mt-1">{item.exampleMeaning}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Notebook() {
  const { items, removeItem } = useLearningData()
  const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null)
  const [detailItem, setDetailItem] = useState<LearningItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LearningItem | null>(null)

  const activeItems = items.filter((i) => !i.archived)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">学習本</h1>
        <p className="text-[13px] text-text-muted">
          {activeItems.length > 0 ? `已保存 ${activeItems.length} 条学习内容` : '还没有学习记录'}
        </p>
      </div>

      {activeItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[15px] text-text-muted">还没有学习记录</p>
          <p className="text-[13px] text-text-light mt-1">去 AI解析 添加你的第一条学习内容吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-2xl border border-border p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <LearningText
                    text={item.word}
                    reading={item.reading}
                    ruby={item.ruby}
                    className="text-[16px] text-text-main"
                  />
                  <p className="text-[13px] text-text-muted mt-1.5">{item.meaning}</p>
                </div>
                <ChevronRight size={16} className="text-text-light group-hover:text-text-muted transition-colors mt-1 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Basic detail modal (Card 1 detail) */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl border border-border w-full max-w-[420px] mx-4 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <LearningText
                text={selectedItem.word}
                reading={selectedItem.reading}
                ruby={selectedItem.ruby}
                className="text-[20px] text-text-main"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-body hover:bg-card transition-colors -mt-1 -mr-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[15px] font-medium text-text-main mb-5">{selectedItem.meaning}</p>

            <div>
              <h4 className="jp-text text-[11px] font-medium text-text-muted mb-2">例文</h4>
              <div className="bg-card rounded-xl p-3">
                <p className="jp-text text-[13px] text-text-body leading-relaxed">{selectedItem.example}</p>
                <p className="text-[12px] text-text-muted mt-1">{selectedItem.exampleMeaning}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => {
                  setDeleteTarget(selectedItem)
                }}
                className="inline-flex items-center gap-1.5 text-[12px] text-text-light hover:text-danger transition-colors"
                aria-label="削除"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => {
                  setDetailItem(selectedItem)
                }}
                className="inline-flex items-center gap-1 text-[13px] text-primary hover:text-primary-deep transition-colors font-medium"
              >
                详细
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl border border-border w-full max-w-[360px] mx-4 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="jp-text text-[16px] font-semibold text-text-main mb-2">
              この単語を削除しますか？
            </h3>
            <p className="jp-text text-[13px] text-text-muted leading-relaxed mb-6">
              削除すると、学習本からこの単語が削除されます。この操作は元に戻せません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-text-body hover:bg-card transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  removeItem(deleteTarget.id)
                  // Close all related modals
                  if (selectedItem?.id === deleteTarget.id) setSelectedItem(null)
                  if (detailItem?.id === deleteTarget.id) setDetailItem(null)
                  setDeleteTarget(null)
                }}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-danger hover:bg-danger/80 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card 2: full detail modal — secondary: back to Card 1, no X */}
      <DetailModal
        open={detailItem !== null}
        onClose={() => setDetailItem(null)}
        backLabel="戻る"
        onBack={() => setDetailItem(null)}
      >
        {detailItem && <DetailContent item={detailItem} />}
      </DetailModal>
    </div>
  )
}
