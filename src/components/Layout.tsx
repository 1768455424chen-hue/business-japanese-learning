import { Outlet } from 'react-router-dom'
import { LearningModeProvider } from '../contexts/LearningModeContext'
import { AIProviderProvider } from '../contexts/AIProviderContext'
import { LearningDataProvider } from '../contexts/LearningDataContext'
import Sidebar from './Sidebar'
import UsageGuideGuard from './UsageGuideGuard'

export default function Layout() {
  return (
    <LearningModeProvider>
      <LearningDataProvider>
        <AIProviderProvider>
          <UsageGuideGuard />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto flex justify-center">
              <div className="max-w-[960px] w-full px-8 py-8">
                <Outlet />
              </div>
            </main>
          </div>
        </AIProviderProvider>
      </LearningDataProvider>
    </LearningModeProvider>
  )
}
