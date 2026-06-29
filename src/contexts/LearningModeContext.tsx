import { createContext, useContext, useState, type ReactNode } from 'react'

export type ReadingMode = 'always' | 'hover'

interface LearningModeContextType {
  mode: ReadingMode
  setMode: (mode: ReadingMode) => void
}

const LearningModeContext = createContext<LearningModeContextType>({
  mode: 'always',
  setMode: () => {},
})

export function LearningModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ReadingMode>('always')

  return (
    <LearningModeContext.Provider value={{ mode, setMode }}>
      {children}
    </LearningModeContext.Provider>
  )
}

export function useLearningMode() {
  return useContext(LearningModeContext)
}
