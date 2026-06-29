import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  showCloseButton?: boolean
}

export default function UsageGuideModal({ open, onClose, showCloseButton = true }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh] pb-[6vh] px-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[560px] max-h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="jp-text text-[17px] font-semibold text-text-main">
            使用方法・注意事項
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-body hover:bg-card transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-[14px] text-text-body leading-relaxed">
          {/* 1. Basic usage */}
          <section>
            <h3 className="text-[13px] font-semibold text-text-main mb-2">
              1. 基本使用方法
            </h3>
            <ol className="space-y-1 list-decimal list-inside text-[13px]">
              <li>在「AI解析」中输入商务日语句子。</li>
              <li>AI 会拆分出词汇、表达、语法等学习点。</li>
              <li>选择想学习的项目，加入「学習本」。</li>
              <li>在「復習」中反复记忆。</li>
              <li>达到熟练后，在「AIテスト」中测试。</li>
              <li>三种测试（选择、填空、判断）都通过后，该学习项被视为完全掌握。</li>
            </ol>
          </section>

          {/* 2. AI Key */}
          <section>
            <h3 className="text-[13px] font-semibold text-text-main mb-2">
              2. AI Key について
            </h3>
            <p className="text-[13px]">
              本工具默认使用 Mock 模式，可以体验示例数据。
            </p>
            <p className="text-[13px] mt-1">
              如需使用真实 AI，请在「設定」中选择一键预设（ChatGPT / Gemini / DeepSeek / Kimi），仅需填写你自己的 API Key 并测试连接后即可使用。
            </p>
            <p className="text-[13px] mt-1">
              也可以选择「自定义 OpenAI-compatible」手动填写 Base URL 和 Model。
            </p>
            <p className="text-[13px] mt-1">
              本工具不提供公共 API Key。
            </p>
          </section>

          {/* 3. Recommended config */}
          <section>
            <h3 className="text-[13px] font-semibold text-text-main mb-2">
              3. 推荐配置示例
            </h3>
            <div className="bg-card rounded-xl p-3 text-[13px] space-y-1">
              <p className="font-medium">DeepSeek：</p>
              <p>Base URL: <code className="bg-white px-1.5 py-0.5 rounded text-[12px]">https://api.deepseek.com</code></p>
              <p>Model: <code className="bg-white px-1.5 py-0.5 rounded text-[12px]">deepseek-chat</code></p>
              <p className="text-text-muted text-[12px] mt-1">
                其他 OpenAI-compatible provider 也可能可用，但兼容性可能不同。
              </p>
            </div>
          </section>

          {/* 4. Privacy */}
          <section>
            <h3 className="text-[13px] font-semibold text-text-main mb-2">
              4. 隐私与本地保存
            </h3>
            <ul className="space-y-1 text-[13px] list-disc list-inside">
              <li>学习数据保存在当前浏览器本地。</li>
              <li>API Key 也保存在当前浏览器本地。</li>
              <li>本工具不做登录，不上传学习数据到自己的服务器。</li>
              <li>使用真实 AI 时，你输入的句子会发送给你选择的 AI Provider。</li>
              <li>如果清空浏览器数据，学习记录可能会丢失。</li>
            </ul>
          </section>

          {/* 5. Notes */}
          <section>
            <h3 className="text-[13px] font-semibold text-text-main mb-2">
              5. 注意事项
            </h3>
            <ul className="space-y-1 text-[13px] list-disc list-inside">
              <li>API Key 可能产生费用，请自行确认 provider 的计费规则。</li>
              <li>部分 provider 不允许浏览器直接调用，可能出现 CORS / Failed to fetch 错误。</li>
              <li>如果出现 CORS 错误，请更换支持浏览器直连的 provider。</li>
              <li>公共电脑或他人设备上不建议保存 API Key。</li>
              <li>AI 解析结果可能不完全准确，请根据实际语境判断。</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:bg-primary-deep transition-colors"
          >
            了解しました
          </button>
        </div>
      </div>
    </div>
  )
}
