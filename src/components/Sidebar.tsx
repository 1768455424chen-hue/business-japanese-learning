import { NavLink, useLocation } from 'react-router-dom'
import { Home, Sparkles, BookOpen, RotateCcw, Brain, Settings, Eye, EyeOff } from 'lucide-react'
import { useLearningMode } from '../contexts/LearningModeContext'

const navItems = [
  { to: '/', icon: Home, ja: 'ホーム' },
  { to: '/analyze', icon: Sparkles, ja: 'AI解析' },
  { to: '/notebook', icon: BookOpen, ja: '学習本' },
  { to: '/review', icon: RotateCcw, ja: '復習' },
  { to: '/quiz', icon: Brain, ja: 'AIテスト' },
  { to: '/settings', icon: Settings, ja: '設定' },
]

export default function Sidebar() {
  const location = useLocation()
  const { mode, setMode } = useLearningMode()

  return (
    <aside className="w-[220px] min-w-[220px] bg-white border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-semibold">B</span>
          </div>
          <span className="text-[15px] font-semibold text-text-main tracking-tight">
            Business Japanese
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-body hover:bg-card'
              }`}
            >
              <item.icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? 'text-primary' : 'text-text-muted'}
              />
              <span className="jp-text text-[13px]">{item.ja}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Learning Mode Toggle */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-card">
        <p className="jp-text text-[11px] text-text-muted mb-2">学習モード</p>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('always')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] transition-colors ${
              mode === 'always'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-body'
            }`}
          >
            <Eye size={12} />
            <span className="jp-text">常に表示</span>
          </button>
          <button
            onClick={() => setMode('hover')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] transition-colors ${
              mode === 'hover'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-body'
            }`}
          >
            <EyeOff size={12} />
            <span className="jp-text">ホバー</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] text-text-light">V0.1 MVP</p>
      </div>
    </aside>
  )
}
