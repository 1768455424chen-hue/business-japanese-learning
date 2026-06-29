# Review Assessment Prompt v1

评估用户对学习条目的掌握程度。直接返回纯 JSON 对象，不要用 ```json 代码块包裹，不要添加解释文字。

## 学习条目
{{item}}

## 用户回答
{{userAnswer}}

## 输出格式
{
  "result": "correct|incorrect",
  "feedback": "简短反馈（中文）",
  "suggestedMastery": "RECOGNIZE|CAN_USE|PROFICIENT"
}

## 评估标准
- correct: 用户准确理解单词含义和用法
- incorrect: 用户理解有误或不完整
- 对于发音类问题，轻微口音差异可接受
- 对于释义类问题，核心意思正确即可
