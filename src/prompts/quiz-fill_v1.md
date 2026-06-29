# Quiz: Fill-in-the-Blank Prompt v1

基于学习条目生成填空题。直接返回纯 JSON 数组，不要用 ```json 代码块包裹，不要添加解释文字。

## 学习条目
{{items}}

## 输出格式
[
  {
    "id": "q-1",
    "type": "fill",
    "question": "「______」—— 中文释义",
    "answer": "正确答案（日语单词）",
    "explanation": "解释（中文）",
    "source": "来源单词"
  }
]

## 要求
- 生成 {{count}} 道填空题
- 题目给中文释义，让学生填日语单词
- 答案精确匹配单词本身
