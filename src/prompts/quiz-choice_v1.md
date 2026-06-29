# Quiz: Multiple Choice Prompt v1

基于学习条目生成选择题。直接返回纯 JSON 数组，不要用 ```json 代码块包裹，不要添加解释文字。

## 学习条目
{{items}}

## 输出格式
[
  {
    "id": "q-1",
    "type": "choice",
    "question": "题目（中文）",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "正确选项",
    "explanation": "解释（中文）",
    "source": "来源单词"
  }
]

## 要求
- 生成 {{count}} 道选择题
- 每个题目基于一个学习条目
- 干扰项从其他条目的释义中选取
- 题目用中文提问，选项为中文释义
