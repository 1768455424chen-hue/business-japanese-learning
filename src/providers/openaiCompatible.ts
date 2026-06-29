import type { AIProvider } from './index'
import type { AnalysisResult, QuizQuestion, LearningItem } from '../types'
import { sanitizeLearningPoint } from '../utils/sanitize'

import promptTemplate from '../prompts/analysis_v1.md?raw'
import systemPromptTemplate from '../prompts/system_v1.md?raw'

// ---- Markdown fence stripping ----

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }
  return trimmed
}

// ---- Field alias mapping ----

const FIELD_ALIASES: Record<string, string> = {
  term: 'word',
  expression: 'word',
  phrase: 'word',
  japanese: 'word',
  pronunciation: 'reading',
  kana: 'reading',
  yomi: 'reading',
  translation: 'meaning',
  chinese: 'meaning',
  explanation: 'meaning',
}

/**
 * Map known field aliases to canonical names.
 * e.g. { term, pronunciation, translation } → { word, reading, meaning }
 */
function mapFieldAliases(item: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = { ...item }
  for (const [alias, canonical] of Object.entries(FIELD_ALIASES)) {
    if (alias in mapped && !(canonical in mapped)) {
      mapped[canonical] = mapped[alias]
    }
  }
  return mapped
}

// ---- Grouped field names that may contain learning items ----

const GROUPED_FIELD_NAMES = [
  'vocabulary',
  'words',
  'grammar',
  'grammars',
  'collocations',
  'phrases',
  'expressions',
  'businessExpressions',
]

// ---- Response normalization ----

/**
 * Normalize raw AI response into a consistent { input, items } shape.
 *
 * Handles:
 *   1. Standard { input, items }
 *   2. Missing input → filled from originalInput
 *   3. Raw array → wrapped as { input, items }
 *   4. Alias fields: learningPoints / points → items
 *   5. Nested: analysis.items, result.items, data.items, output.items
 *   6. Grouped fields: vocabulary, grammar, etc. → merged into items
 *   7. analysis/result/data/output as direct array → used as items
 */
function normalizeAnalysisResponse(
  raw: unknown,
  originalInput: string,
): Record<string, unknown> {
  // Case 3: raw response is a top-level array
  if (Array.isArray(raw)) {
    if (import.meta.env.DEV) console.debug('[AI normalize] raw array → wrapped as { input, items }')
    return { input: originalInput, items: raw }
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('AI 响应格式错误：不是有效的 JSON 对象')
  }

  const obj = { ...(raw as Record<string, unknown>) }

  // Ensure input exists
  if (typeof obj.input !== 'string' || !obj.input.trim()) {
    if (import.meta.env.DEV) console.debug('[AI normalize] input missing → filled from originalInput')
    obj.input = originalInput
  }

  // If items exists as a proper array, we're done after input fix
  if (Array.isArray(obj.items)) {
    return obj
  }

  // Case 4: top-level alias fields
  if (Array.isArray(obj.learningPoints)) {
    if (import.meta.env.DEV) console.debug('[AI normalize] learningPoints → items')
    obj.items = obj.learningPoints
    return obj
  }
  if (Array.isArray(obj.points)) {
    if (import.meta.env.DEV) console.debug('[AI normalize] points → items')
    obj.items = obj.points
    return obj
  }

  // Case 5: nested items (analysis.items, result.items, data.items, output.items)
  for (const key of ['analysis', 'result', 'data', 'output']) {
    const nested = obj[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const nestedObj = nested as Record<string, unknown>
      // Case 7: nested value is an array → use as items directly
      if (Array.isArray(nestedObj.items)) {
        if (import.meta.env.DEV) console.debug(`[AI normalize] ${key}.items → items`)
        obj.items = nestedObj.items
        return obj
      }
      // Some AIs put items inside a nested object without explicit "items" key
      // Try to find any array inside the nested object
      const nestedKeys = Object.keys(nestedObj)
      for (const nk of nestedKeys) {
        if (Array.isArray(nestedObj[nk]) && nestedObj[nk].length > 0) {
          const first = nestedObj[nk][0]
          if (typeof first === 'object' && first !== null && ('word' in first || 'term' in first)) {
            if (import.meta.env.DEV) console.debug(`[AI normalize] ${key}.${nk} → items`)
            obj.items = nestedObj[nk] as unknown[]
            return obj
          }
        }
      }
    }
    // Case 7: nested value itself is an array
    if (Array.isArray(nested)) {
      if (import.meta.env.DEV) console.debug(`[AI normalize] ${key} (array) → items`)
      obj.items = nested as unknown[]
      return obj
    }
  }

  // Case 6: grouped fields — merge vocabulary, grammar, etc. into one items array
  const mergedItems: unknown[] = []
  for (const field of GROUPED_FIELD_NAMES) {
    if (Array.isArray(obj[field])) {
      mergedItems.push(...(obj[field] as unknown[]))
    }
  }
  if (mergedItems.length > 0) {
    if (import.meta.env.DEV) console.debug('[AI normalize] grouped fields merged → items')
    obj.items = mergedItems
    return obj
  }

  // Still no items — return as-is so validateAnalysisResult can throw a clear error
  if (import.meta.env.DEV) {
    console.debug('[AI parsed response shape]', {
      keys: Object.keys(obj),
      rawPreview: JSON.stringify(obj).slice(0, 1000),
    })
  }
  return obj
}

// ---- Top-level validation ----

function validateAnalysisResult(data: Record<string, unknown>, inputText: string): AnalysisResult {
  if (!Array.isArray(data.items)) {
    // Check if it looks like grouped structure that failed to merge
    const hasGroupedFields = GROUPED_FIELD_NAMES.some((f) => Array.isArray(data[f]))
    if (hasGroupedFields) {
      throw new Error('AI 返回了分组结构，但未能转换为学习点，请重试。')
    }
    throw new Error('AI 响应缺少 items 数组')
  }

  if (data.items.length === 0) {
    throw new Error('AI 未解析到任何知识点（items 为空）')
  }

  const sanitizedItems: Record<string, unknown>[] = []
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i]
    if (!item || typeof item !== 'object') continue
    // Map field aliases before sanitizing
    const mapped = mapFieldAliases(item as Record<string, unknown>)
    const cleaned = sanitizeLearningPoint(mapped)
    if (cleaned) {
      sanitizedItems.push(cleaned)
    }
  }

  if (sanitizedItems.length === 0) {
    throw new Error('AI 返回的数据格式不完整，请重试或更换输入。')
  }

  return {
    input: (data.input as string) || inputText,
    items: sanitizedItems as unknown as AnalysisResult['items'],
  }
}

// ---- API call with response_format fallback ----

async function callAI(
  baseUrl: string,
  model: string,
  apiKey: string,
  text: string,
): Promise<unknown> {
  const prompt = promptTemplate.replace('{{input}}', text)

  const makeRequest = async (withResponseFormat: boolean): Promise<Response> => {
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPromptTemplate },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }
    if (withResponseFormat) {
      body.response_format = { type: 'json_object' }
    }
    return fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
  }

  // Try with response_format first
  let response: Response
  try {
    response = await makeRequest(true)
  } catch (err) {
    throw new Error(`网络请求失败：${err instanceof Error ? err.message : '未知错误'}`)
  }

  // Fallback: if 400 and response suggests response_format is unsupported, retry without it
  if (!response.ok && response.status === 400) {
    let bodyText = ''
    try {
      bodyText = await response.text()
    } catch { /* ignore */ }
    const lowerBody = bodyText.toLowerCase()
    const isFormatError =
      lowerBody.includes('response_format') ||
      lowerBody.includes('unsupported') ||
      lowerBody.includes('unavailable') ||
      lowerBody.includes('invalid_request_error')
    if (isFormatError) {
      if (import.meta.env.DEV) console.debug('[AI] response_format unsupported, retrying without it')
      try {
        response = await makeRequest(false)
      } catch (err) {
        throw new Error(`网络请求失败：${err instanceof Error ? err.message : '未知错误'}`)
      }
    }
  }

  if (!response.ok) {
    let bodyText = ''
    try {
      bodyText = await response.text()
    } catch { /* ignore */ }
    throw new Error(`API 请求失败（${response.status}）${bodyText ? ': ' + bodyText : ''}`)
  }

  let rawText: string
  try {
    rawText = await response.text()
  } catch {
    throw new Error('AI 响应内容为空')
  }

  // 1. Parse the API response envelope
  let apiJson: unknown
  try {
    apiJson = JSON.parse(rawText)
  } catch {
    throw new Error('AI 响应无法解析为 JSON，请重试。')
  }

  if (import.meta.env.DEV) {
    const api = apiJson as Record<string, unknown>
    console.debug('[AI api response shape]', {
      keys: Object.keys(api),
      hasChoices: Array.isArray(api.choices),
      hasContent: Boolean(
        Array.isArray(api.choices) &&
        (api.choices as Record<string, unknown>[])[0]?.message &&
        ((api.choices as Record<string, unknown>[])[0].message as Record<string, unknown>)?.content
      ),
    })
  }

  // 2. Extract assistant content from OpenAI Chat Completions wrapper
  const wrapper = apiJson as Record<string, unknown>
  if (
    Array.isArray(wrapper.choices) &&
    wrapper.choices.length > 0
  ) {
    const firstChoice = wrapper.choices[0] as Record<string, unknown>
    const message = firstChoice.message as Record<string, unknown> | undefined
    if (message && typeof message.content === 'string' && message.content.trim()) {
      const content = message.content.trim()

      if (import.meta.env.DEV) {
        console.debug('[AI assistant content preview]', content.slice(0, 1000))
      }

      const cleanContent = stripMarkdownFences(content)

      try {
        return JSON.parse(cleanContent)
      } catch {
        throw new Error('AI 响应 content 无法解析为 JSON，请重试。')
      }
    }

    throw new Error('AI 响应缺少 assistant content')
  }

  // 3. Not a Chat Completions wrapper — assume the response itself is the analysis JSON
  return apiJson
}

// ---- Provider factory ----

export function createOpenAICompatibleProvider(config: {
  baseUrl: string
  model: string
  apiKey: string
}): AIProvider {
  const { baseUrl, model, apiKey } = config

  return {
    async analyze(text: string): Promise<AnalysisResult> {
      const json = await callAI(baseUrl, model, apiKey, text)

      if (import.meta.env.DEV) {
        console.debug('[AI raw response]', JSON.stringify(json).slice(0, 500))
      }

      const normalized = normalizeAnalysisResponse(json, text)
      return validateAnalysisResult(normalized, text)
    },

    async generateQuiz(
      items: LearningItem[],
      type: QuizQuestion['type'],
      count: number
    ): Promise<QuizQuestion[]> {
      const pool = items.filter((i) => !i.archived)
      if (pool.length === 0) return []

      const safeCount = Math.min(count, pool.length)
      const questions: QuizQuestion[] = []

      if (type === 'judgment') {
        for (let i = 0; i < safeCount; i++) {
          const item = pool[i]
          const sentence = item.example || `${item.word}を使用した例文です。`
          const isCorrectUsage = i % 2 === 0
          if (isCorrectUsage) {
            questions.push({
              id: `q-fallback-judgment-${i}`,
              type: 'judgment',
              question: `目標ワード：${item.word}\n\n例文：\n${sentence}\n\nこの文での「${item.word}」の使い方は正しいですか。`,
              answer: 'true',
              explanation: `「${item.word}」は「${item.meaning}」という意味で、この文脈で自然に使われています。`,
              source: item.word,
            })
          } else {
            const wrongPatterns = [
              `${item.word}は美味しいですね。`,
              `${item.word}な天気になりました。`,
              `昨日${item.word}を食べに行きました。`,
            ]
            const wrongSentence = wrongPatterns[i % wrongPatterns.length]
            questions.push({
              id: `q-fallback-judgment-${i}`,
              type: 'judgment',
              question: `目標ワード：${item.word}\n\n例文：\n${wrongSentence}\n\nこの文での「${item.word}」の使い方は正しいですか。`,
              answer: 'false',
              explanation: `「${item.word}」は「${item.meaning}」という意味で、この文脈には合いません。`,
              source: item.word,
            })
          }
        }
        return questions
      }

      for (let i = 0; i < safeCount; i++) {
        const item = pool[i]
        if (type === 'choice') {
          const others = pool.filter((x) => x.id !== item.id).map((x) => x.meaning)
          const distractors = others.slice(0, 3)
          while (distractors.length < 3) {
            distractors.push(`选项${distractors.length + 1}`)
          }
          const options = [item.meaning, ...distractors]
          for (let j = options.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1))
            ;[options[j], options[k]] = [options[k], options[j]]
          }
          questions.push({
            id: `q-fallback-choice-${i}`,
            type: 'choice',
            question: `「${item.word}」の正しい意味は？`,
            options,
            answer: item.meaning,
            explanation: `「${item.word}」は「${item.meaning}」という意味です。`,
            source: item.word,
          })
        } else {
          questions.push({
            id: `q-fallback-fill-${i}`,
            type: 'fill',
            question: `「______」—— ${item.meaning}`,
            answer: item.word,
            explanation: `「${item.word}」は「${item.meaning}」という意味です。`,
            source: item.word,
          })
        }
      }
      return questions
    },
  }
}

// ===== Test Connection =====

function mapTestError(msg: string): string {
  const lower = msg.toLowerCase()
  if (msg.includes('401') || lower.includes('unauthorized') || lower.includes('invalid api key'))
    return 'API Key 可能不正确，请确认后重新填写。'
  if (msg.includes('402') || msg.includes('403') || lower.includes('forbidden') || lower.includes('insufficient'))
    return '当前 API Key 可能没有可用额度，或没有访问该模型的权限。'
  if (msg.includes('429') || lower.includes('rate') || lower.includes('too many'))
    return '请求过于频繁，请稍后再试。'
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('cors'))
    return '当前 Provider 暂不支持浏览器直接调用，或网络请求被浏览器拦截。请更换其他 Provider，或使用自定义 OpenAI-compatible 配置可用的服务。'
  if (msg.includes('404') || lower.includes('not found'))
    return '当前 Provider 的接口地址或模型配置不可用。请更换 Provider，或使用自定义 OpenAI-compatible 手动配置。'
  if (lower.includes('json') || lower.includes('parse') || lower.includes('内容') || lower.includes('格式'))
    return '当前模型返回格式不符合要求。请重试，或更换其他 Provider。'
  return `连接测试失败：${msg}`
}

export async function testConnection(config: {
  baseUrl: string
  model: string
  apiKey: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const json = await callAI(config.baseUrl, config.model, config.apiKey, '確認いたします。')
    const normalized = normalizeAnalysisResponse(json, '確認いたします。')
    validateAnalysisResult(normalized, '確認いたします。')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误'
    return { success: false, error: mapTestError(msg) }
  }
}
