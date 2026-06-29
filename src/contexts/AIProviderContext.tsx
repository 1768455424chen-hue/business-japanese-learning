import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { mockAIProvider, type AIProvider } from '../providers'
import { createOpenAICompatibleProvider } from '../providers/openaiCompatible'
import { useLearningData } from './LearningDataContext'

const AIProviderContext = createContext<AIProvider | null>(null)

const configMissingError =
  '請先在設定中填寫 API Key、Base URL 和 Model。\n設定で API Key、Base URL、Model を入力してください。'

function createConfigMissingProvider(): AIProvider {
  return {
    async analyze() {
      throw new Error(configMissingError)
    },
    async generateQuiz() {
      throw new Error(configMissingError)
    },
  }
}

export function AIProviderProvider({ children }: { children: ReactNode }) {
  const { settings } = useLearningData()

  const provider: AIProvider = useMemo(() => {
    if (settings.provider === 'mock') {
      return mockAIProvider
    }

    if (settings.provider === 'openai-compatible') {
      if (settings.apiKey && settings.baseUrl && settings.model) {
        return createOpenAICompatibleProvider({
          baseUrl: settings.baseUrl,
          model: settings.model,
          apiKey: settings.apiKey,
        })
      }
      // Config missing: return a provider that throws a clear error, NOT mock
      return createConfigMissingProvider()
    }

    // Unknown provider — fall back to mock (safe default for unrecognized values)
    return mockAIProvider
  }, [settings.provider, settings.apiKey, settings.baseUrl, settings.model])

  return (
    <AIProviderContext.Provider value={provider}>
      {children}
    </AIProviderContext.Provider>
  )
}

export function useAIProvider(): AIProvider {
  const ctx = useContext(AIProviderContext)
  if (!ctx) throw new Error('useAIProvider must be used within AIProviderProvider')
  return ctx
}
