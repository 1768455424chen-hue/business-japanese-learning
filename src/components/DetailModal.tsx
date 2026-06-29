import { type ReactNode } from 'react'
import { X, ArrowLeft } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  wide?: boolean
  backLabel?: string
  onBack?: () => void
  children: ReactNode
}

export default function DetailModal({ open, onClose, wide, backLabel, onBack, children }: Props) {
  if (!open) return null

  const isSecondary = !!(backLabel && onBack)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] pb-[8vh] px-4 bg-black/30 backdrop-blur-sm"
      onClick={isSecondary ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl border border-border shadow-xl w-full flex flex-col"
        style={{ maxWidth: wide ? 'min(900px, 80vw)' : '440px', maxHeight: '84vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: nav row (back + close) — fixed, never scrolls */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0 min-h-[40px]">
          <div className="w-20">
            {isSecondary && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text-body transition-colors"
              >
                <ArrowLeft size={14} />
                {backLabel}
              </button>
            )}
          </div>
          {!isSecondary && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-body hover:bg-card transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body: scrollable content */}
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
