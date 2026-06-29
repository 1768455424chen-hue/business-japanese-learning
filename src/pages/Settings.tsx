import { useState, useEffect, useCallback } from 'react'
import { Settings as SettingsIcon, Check, Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { useLearningData } from '../contexts/LearningDataContext'
import type { Settings } from '../types'
import { testConnection } from '../providers/openaiCompatible'
import UsageGuideModal from '../components/UsageGuideModal'

// ===== Preset Definitions =====

type PresetKey = 'mock' | 'openai' | 'gemini' | 'deepseek' | 'kimi' | 'custom'

interface Preset {
  key: PresetKey
  label: string
  desc: string
  baseUrl?: string
  model?: string
  note?: string
  isCustom?: boolean
}

const PRESETS: Preset[] = [
  { key: 'mock', label: 'Mock 模式', desc: '体验示例数据，不调用真实 AI' },
  {
    key: 'openai',
    label: 'ChatGPT / OpenAI API',
    desc: '使用 OpenAI API Key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    note: '需要 OpenAI API Key，非 ChatGPT 网页版账号或 ChatGPT Plus。',
  },
  {
    key: 'gemini',
    label: 'Gemini',
    desc: '使用 Gemini API Key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-3.5-flash',
  },
  {
    key: 'deepseek',
    label: 'DeepSeek',
    desc: '使用 DeepSeek API Key',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
  },
  {
    key: 'kimi',
    label: 'Kimi / Moonshot',
    desc: '使用 Moonshot / Kimi API Key',
    baseUrl: 'https://api.moonshot.ai/v1',
    model: 'kimi-k2.6',
  },
  {
    key: 'custom',
    label: '自定义 OpenAI-compatible',
    desc: '高级设置，自行填写 Base URL 和 Model',
    isCustom: true,
  },
]

// ===== Component =====

export default function SettingsPage() {
  const { settings, updateSettings } = useLearningData()

  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(
    (settings.providerPreset as PresetKey) || 'mock',
  )
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl)
  const [model, setModel] = useState(settings.model)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const [connectionVerified, setConnectionVerified] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [showUsageGuide, setShowUsageGuide] = useState(false)

  // Sync from context when settings change externally
  useEffect(() => {
    setSelectedPreset((settings.providerPreset as PresetKey) || 'mock')
    setApiKey(settings.apiKey)
    setBaseUrl(settings.baseUrl)
    setModel(settings.model)
  }, [settings.providerPreset, settings.apiKey, settings.baseUrl, settings.model])

  const currentPreset = PRESETS.find((p) => p.key === selectedPreset) ?? PRESETS[0]
  const needsApiKey = selectedPreset !== 'mock'
  const needsTest = selectedPreset !== 'mock'

  // Reset verification when inputs change
  const resetVerification = useCallback(() => {
    setConnectionVerified(false)
    setTestError(null)
  }, [])

  const handlePresetChange = (key: PresetKey) => {
    setSelectedPreset(key)
    setSaved(false)
    resetVerification()
    const preset = PRESETS.find((p) => p.key === key)
    if (key === 'mock') {
      setApiKey('')
      setBaseUrl('')
      setModel('')
    } else if (preset?.isCustom) {
      // Keep current values for custom
    } else if (preset?.baseUrl && preset?.model) {
      setBaseUrl(preset.baseUrl)
      setModel(preset.model)
    }
  }

  const handleApiKeyChange = (val: string) => {
    setApiKey(val)
    setSaved(false)
    resetVerification()
  }

  const handleBaseUrlChange = (val: string) => {
    setBaseUrl(val)
    setSaved(false)
    resetVerification()
  }

  const handleModelChange = (val: string) => {
    setModel(val)
    setSaved(false)
    resetVerification()
  }

  // ===== Test Connection =====
  const handleTestConnection = async () => {
    if (selectedPreset === 'mock') return

    const preset = currentPreset
    const testBaseUrl = preset.isCustom ? baseUrl : preset.baseUrl ?? baseUrl
    const testModel = preset.isCustom ? model : preset.model ?? model

    if (!apiKey.trim()) {
      setTestError(
        preset.isCustom
          ? '请填写 API Key、Base URL 和 Model。'
          : '请先填写当前 Provider 的 API Key。',
      )
      return
    }
    if (preset.isCustom && (!testBaseUrl.trim() || !testModel.trim())) {
      setTestError('请填写 API Key、Base URL 和 Model。')
      return
    }

    setTesting(true)
    setTestError(null)
    setConnectionVerified(false)

    const result = await testConnection({
      baseUrl: testBaseUrl.trim(),
      model: testModel.trim(),
      apiKey: apiKey.trim(),
    })

    setTesting(false)

    if (result.success) {
      setConnectionVerified(true)
    } else {
      setTestError(result.error ?? '连接测试失败，请重试。')
    }
  }

  // ===== Save =====
  const canSave =
    selectedPreset === 'mock' ||
    (connectionVerified &&
      apiKey.trim() &&
      (currentPreset.isCustom ? baseUrl.trim() && model.trim() : true))

  const handleSave = () => {
    const preset = currentPreset
    const updates: Partial<Settings> = {
      providerPreset: selectedPreset,
      provider: selectedPreset === 'mock' ? 'mock' : 'openai-compatible',
      apiKey: selectedPreset === 'mock' ? '' : apiKey,
      baseUrl: preset.isCustom
        ? baseUrl
        : selectedPreset === 'mock'
          ? ''
          : preset.baseUrl ?? baseUrl,
      model: preset.isCustom
        ? model
        : selectedPreset === 'mock'
          ? ''
          : preset.model ?? model,
    }
    updateSettings(updates)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ===== Render =====
  return (
    <div className="space-y-8">
      <div>
        <h1 className="jp-text text-[22px] font-semibold text-text-main mb-1">設定</h1>
        <p className="text-[13px] text-text-muted">AI プロバイダーと API 設定</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        {/* Preset Selector */}
        <div>
          <label className="block text-[13px] font-medium text-text-main mb-3">
            AI プロバイダー
          </label>
          <div className="space-y-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetChange(preset.key)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selectedPreset === preset.key
                    ? 'border-primary bg-primary-light'
                    : 'border-border bg-white hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[14px] font-medium text-text-main">
                      {preset.label}
                    </span>
                    <span className="text-[12px] text-text-muted ml-2">{preset.desc}</span>
                  </div>
                  {selectedPreset === preset.key && (
                    <Check size={16} className="text-primary flex-shrink-0" />
                  )}
                </div>
                {preset.note && selectedPreset === preset.key && (
                  <p className="text-[11px] text-text-muted mt-1.5">{preset.note}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        {needsApiKey && (
          <div>
            <label className="block text-[13px] font-medium text-text-main mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border text-[14px] text-text-main bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors"
                type="button"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Base URL & Model display */}
        {needsApiKey && (
          <>
            {currentPreset.isCustom ? (
              <>
                <div>
                  <label className="block text-[13px] font-medium text-text-main mb-2">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] text-text-main bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-main mb-2">
                    モデル
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    placeholder="gpt-4o-mini"
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] text-text-main bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>
              </>
            ) : (
              <div className="bg-card rounded-xl p-3 space-y-1 text-[13px]">
                <p className="text-text-body">
                  <span className="text-text-muted">Base URL: </span>
                  <code className="text-[12px]">{currentPreset.baseUrl}</code>
                </p>
                <p className="text-text-body">
                  <span className="text-text-muted">Model: </span>
                  <code className="text-[12px]">{currentPreset.model}</code>
                </p>
              </div>
            )}
          </>
        )}

        {/* Test Connection */}
        {needsTest && (
          <div className="pt-1 space-y-3">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium border transition-colors border-border bg-white text-text-main hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>测试中...</span>
                </>
              ) : (
                <>
                  <span>テスト接続</span>
                </>
              )}
            </button>

            {connectionVerified && (
              <div className="flex items-center gap-2 text-[13px] text-primary">
                <Check size={15} />
                <span>连接成功，可以开始使用真实 AI 解析。</span>
              </div>
            )}

            {testError && (
              <div className="text-[13px] text-danger bg-red-50 rounded-xl p-3 leading-relaxed">
                {testError}
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:bg-primary-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saved ? (
              <>
                <Check size={15} />
                <span>保存しました</span>
              </>
            ) : (
              <>
                <SettingsIcon size={15} />
                <span>保存</span>
              </>
            )}
          </button>
          {needsTest && !canSave && !saved && (
            <span className="text-[12px] text-text-muted">
              {!apiKey.trim()
                ? '请填写 API Key 并测试连接'
                : '请先测试连接成功后，再保存配置'}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-[12px] text-text-muted leading-relaxed">
          API Key 和学习数据会保存在当前浏览器的本地数据库中，不会上传到本工具服务器。API Key 仅在向您选择的 AI 服务商发送请求时使用。
        </p>
      </div>

      {/* Claude note */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-[12px] text-text-muted leading-relaxed">
          Claude / Anthropic 暂未作为一键预设提供。如需使用，请等待后续版本支持 Anthropic native
          provider，或使用兼容网关后通过「自定义 OpenAI-compatible」配置。
        </p>
      </div>

      {/* Usage Guide */}
      <button
        onClick={() => setShowUsageGuide(true)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-border hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Info size={17} className="text-text-muted" />
          <span className="text-[14px] font-medium text-text-main">使用方法・注意事項</span>
        </div>
        <span className="text-[12px] text-text-muted">→</span>
      </button>
      <UsageGuideModal open={showUsageGuide} onClose={() => setShowUsageGuide(false)} />
    </div>
  )
}
