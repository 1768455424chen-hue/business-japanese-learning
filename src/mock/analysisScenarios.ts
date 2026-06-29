import type { AnalysisResult } from '../types'

const scenarios: Record<string, AnalysisResult> = {
  営業利益: {
    input: '営業利益',
    items: [
      {
        word: '営業利益',
        reading: 'えいぎょうりえき',
        ruby: ['えい', 'ぎょう', 'り', 'えき'],
        meaning: '营业利润',
        partOfSpeech: '名詞',
        category: 'word',
        example: {
          ja: '今期の営業利益は前年比15%増の500億円となりました。',
          zh: '本期的营业利润同比增长15%，达到500亿日元。',
        },
        grammar: '复合名词。「営業」（营业）+「利益」（利润）组合而成，用于表示企业主营业务产生的利润。',
        collocations: [
          '営業利益を上げる（提高营业利润）',
          '営業利益が減少する（营业利润减少）',
          '営業利益率（营业利润率）',
        ],
        businessExplanation:
          '营业利润是企业通过主营业务获得的利润，是衡量公司核心业务盈利能力的重要指标。在日本的财务报表中，营业利润位于"売上総利益（毛利）"之后、"経常利益（经常利润）"之前。',
        similarExpressions: ['経常利益', '純利益', '粗利益', '営業収益'],
      },
    ],
  },

  検討する: {
    input: '検討する',
    items: [
      {
        word: '検討する',
        reading: 'けんとうする',
        ruby: ['けん', 'とう'],
        meaning: '研究、探讨',
        partOfSpeech: '動詞',
        category: 'word',
        example: { ja: 'その件については現在検討しております。', zh: '关于那件事，我们正在研究中。' },
        grammar: '「検討」＋「する」（サ変動詞）。表示对某个议题进行仔细的研究和讨论。比「考える」更正式。',
        collocations: ['検討中です（正在研究中）', '再検討する（重新研究）', '検討の余地がある（有研究余地）'],
        businessExplanation: '商务场景中非常常用，表示正在认真考虑和研究某个提案或问题。使用「検討しております」比「検討しています」更礼貌。',
        similarExpressions: ['考慮する', '審議する', '考察する'],
      },
    ],
  },

  早速: {
    input: '早速',
    items: [
      {
        word: '早速',
        reading: 'さっそく',
        ruby: ['さっ', 'そく'],
        meaning: '立刻、马上',
        partOfSpeech: '副詞',
        category: 'word',
        example: { ja: '早速ですが、本題に入らせていただきます。', zh: '恕我直言，让我们进入正题。' },
        grammar: '「早速ですが」是商务场景中常用的开场白。用于表示省略冗长的开场，直接进入主题。',
        collocations: ['早速ですが（恕我直言/马上进入正题）', '早速のご返信（立刻回复）', '早速対応する（立即对应）'],
        businessExplanation: '在商务会议或电话中，使用「早速ですが」表示尊重对方时间，不做过多的寒暄直接进入主题。这是一种商务效率意识的体现。',
        similarExpressions: ['早々に', '直ちに', 'すぐに'],
      },
    ],
  },

  円滑に進める: {
    input: '円滑に進める',
    items: [
      {
        word: '円滑に進める',
        reading: 'えんかつにすすめる',
        ruby: ['えん', 'かつ', 'すす'],
        meaning: '顺利推进',
        partOfSpeech: '慣用表現',
        category: 'expression',
        example: { ja: '会議を円滑に進めるために、事前に資料を共有します。', zh: '为了顺利推进会议，提前共享资料。' },
        grammar: '「円滑」（な形容詞）+「に」（副詞化）+「進める」（他動詞）。「円滑」表示顺畅、没有障碍。',
        collocations: ['会議を円滑に進める', '業務を円滑に進める', 'コミュニケーションを円滑にする'],
        businessExplanation: '商务会议中常用表达。强调会议/项目推进的顺畅性，比「スムーズに進める」更正式。',
        similarExpressions: ['スムーズに進める', '順調に進める', '滞りなく進める'],
        components: [
          {
            word: '円滑',
            reading: 'えんかつ',
            ruby: ['えん', 'かつ'],
            meaning: '圆滑、顺畅',
            partOfSpeech: '名詞・な形容詞',
            category: 'word',
            example: { ja: '円滑なコミュニケーション', zh: '顺畅的沟通' },
            grammar: '',
            collocations: ['円滑に進める', '円滑な人間関係'],
            businessExplanation: '',
            similarExpressions: [],
          },
          {
            word: '進める',
            reading: 'すすめる',
            ruby: ['すす'],
            meaning: '推进、进行',
            partOfSpeech: '動詞',
            category: 'word',
            example: { ja: '計画を進める。', zh: '推进计划。' },
            grammar: '一段動詞。他動詞，表示推进某事向前发展。',
            collocations: ['話を進める', '計画を進める', '作業を進める'],
            businessExplanation: '',
            similarExpressions: [],
          },
        ],
      },
    ],
  },

  // Multi-item scenario: full sentence analysis
  '会議を円滑に進めるため、事前に資料を共有いたします。': {
    input: '会議を円滑に進めるため、事前に資料を共有いたします。',
    items: [
      {
        word: '円滑に進める',
        reading: 'えんかつにすすめる',
        ruby: ['えん', 'かつ', 'すす'],
        meaning: '顺利推进',
        partOfSpeech: '慣用表現',
        category: 'expression',
        example: { ja: '会議を円滑に進めるために、事前に資料を共有します。', zh: '为了顺利推进会议，提前共享资料。' },
        grammar: '「円滑」（な形容詞）+「に」（副詞化）+「進める」（他動詞）。表示顺畅、没有障碍地推进某事。',
        collocations: ['会議を円滑に進める', '業務を円滑に進める', 'コミュニケーションを円滑にする'],
        businessExplanation: '商务会议中常用表达。强调会议/项目推进的顺畅性，比「スムーズに進める」更正式。在句中使用「〜ため」表示目的。',
        similarExpressions: ['スムーズに進める', '順調に進める', '滞りなく進める'],
        components: [
          {
            word: '円滑',
            reading: 'えんかつ',
            ruby: ['えん', 'かつ'],
            meaning: '圆滑、顺畅',
            partOfSpeech: '名詞・な形容詞',
            category: 'word',
            example: { ja: '円滑なコミュニケーション', zh: '顺畅的沟通' },
            grammar: '',
            collocations: ['円滑に進める', '円滑な人間関係'],
            businessExplanation: '',
            similarExpressions: [],
          },
          {
            word: '進める',
            reading: 'すすめる',
            ruby: ['すす'],
            meaning: '推进、进行',
            partOfSpeech: '動詞',
            category: 'word',
            example: { ja: '計画を進める。', zh: '推进计划。' },
            grammar: '一段動詞。他動詞，表示推进某事向前发展。',
            collocations: ['話を進める', '計画を進める', '作業を進める'],
            businessExplanation: '',
            similarExpressions: [],
          },
        ],
      },
      {
        word: '事前に',
        reading: 'じぜんに',
        ruby: ['じ', 'ぜん'],
        meaning: '事先、提前',
        partOfSpeech: '副詞',
        category: 'word',
        example: { ja: '事前にご確認いただけますと幸いです。', zh: '如能事先确认将不胜感激。' },
        grammar: '「事前」（名词）+「に」（副词化）。表示在某事发生之前做好准备。商务场景中极为常用。',
        collocations: ['事前に確認する（事先确认）', '事前に準備する（事先准备）', '事前の打ち合わせ（事前协商）'],
        businessExplanation: '日本商务文化高度重视"事先准备"和"事前沟通"（根回し）。「事前に」体现了这种对准备工作的重要性的认识。',
        similarExpressions: ['あらかじめ', '前もって', '事前に'],
      },
      {
        word: '資料を共有する',
        reading: 'しりょうをきょうゆうする',
        ruby: ['し', 'りょう', 'きょう', 'ゆう'],
        meaning: '共享资料',
        partOfSpeech: '動詞句',
        category: 'expression',
        example: { ja: '資料を共有いたしますので、ご確認ください。', zh: '我将共享资料，请确认。' },
        grammar: '「資料」（资料）+「を」+「共有する」（共享）。サ変動詞「共有」+「する」。',
        collocations: ['資料を共有する（共享资料）', '情報を共有する（共享信息）', '画面を共有する（共享屏幕）'],
        businessExplanation: '在远程会议和协作办公中非常常用。日本企业重视信息的及时共享，「共有」一词比「シェア」更正式。',
        similarExpressions: ['シェアする', '展開する', '共有させる'],
        components: [
          {
            word: '資料',
            reading: 'しりょう',
            ruby: ['し', 'りょう'],
            meaning: '资料',
            partOfSpeech: '名詞',
            category: 'word',
            example: { ja: '資料をご確認ください。', zh: '请确认资料。' },
            grammar: '',
            collocations: ['資料を作成する', '資料を配布する', '参考資料'],
            businessExplanation: '',
            similarExpressions: [],
          },
          {
            word: '共有する',
            reading: 'きょうゆうする',
            ruby: ['きょう', 'ゆう'],
            meaning: '共享',
            partOfSpeech: '動詞',
            category: 'word',
            example: { ja: '情報を共有する。', zh: '共享信息。' },
            grammar: '「共有」＋「する」（サ変動詞）。',
            collocations: ['情報を共有する', '画面を共有する', 'ファイルを共有する'],
            businessExplanation: '',
            similarExpressions: [],
          },
        ],
      },
      {
        word: 'いたします',
        reading: 'いたします',
        ruby: undefined,
        meaning: '做、进行',
        partOfSpeech: '補助動詞',
        category: 'grammar',
        example: { ja: 'お送りいたします。', zh: '我将为您发送。' },
        grammar: '「する」的谦让语（謙譲語）。用于自己的动作，降低自己以表示对对方的尊重。比「します」更礼貌，是商务场景的标准表达。',
        collocations: ['〜いたします', 'お〜いたします', 'ご〜いたします'],
        businessExplanation: '日式商务敬语的核心之一。对外部人员或客户时必须使用谦让语。「いたします」是「する」最常用的谦让形式。句式「お/ご + 名词 + いたします」是商务日语的基本句型。',
        similarExpressions: ['申し上げます', 'させていただきます', '致します'],
        components: [
          {
            word: 'する',
            reading: 'する',
            ruby: undefined,
            meaning: '做、进行',
            partOfSpeech: '動詞',
            category: 'word',
            example: { ja: '仕事をする。', zh: '做工作。' },
            grammar: 'サ変動詞の辞書形（基本形）。「いたします」是「する」的谦让语形式。',
            collocations: ['〜をする', '〜がする', '〜とする'],
            businessExplanation: '商务场景中「する」有多种敬语变形：谦让语「いたします」、尊敬语「なさいます」、郑重语「します」。',
            similarExpressions: [],
          },
        ],
      },
    ],
  },
}

// Default fallback for unknown input
export function getAnalysisFor(input: string): AnalysisResult {
  const trimmed = input.trim()
  if (scenarios[trimmed]) return scenarios[trimmed]

  // Unknown input → empty items, page shows unsupported hint
  return { input: trimmed, items: [] }
}
