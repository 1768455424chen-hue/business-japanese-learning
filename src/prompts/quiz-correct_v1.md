# Quiz: Error Correction Prompt v1

基于学习条目生成改错题。直接返回纯 JSON 数组，不要用 ```json 代码块包裹，不要添加解释文字。

## 学习条目
{{items}}

## 输出格式
[
  {
    "id": "q-1",
    "type": "correct",
    "question": "找出错误并改正：\n错误的句子",
    "answer": "正确的句子",
    "explanation": "解释（中文）",
    "source": "来源单词"
  }
]

## 要求
- 生成 {{count}} 道改错题
- 错误类型：助词错误、敬语使用不当、商务场景不自然
- 每个错误句子基于学习条目的例句修改
- 确保错误是可识别、有明确正确答案的
