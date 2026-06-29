import type { LearningItem, ReviewRecord } from '../types'

export function updateMastery(
  currentMastery: LearningItem['mastery'],
  result: ReviewRecord['result'],
): LearningItem['mastery'] {
  if (result === 'skip') return currentMastery

  if (result === 'incorrect') {
    // 逐级降级：PROFICIENT→CAN_USE, CAN_USE→RECOGNIZE, RECOGNIZE→RECOGNIZE
    if (currentMastery === 'PROFICIENT') return 'CAN_USE'
    if (currentMastery === 'CAN_USE') return 'RECOGNIZE'
    return 'RECOGNIZE'
  }

  // correct: 一步升级
  if (currentMastery === 'RECOGNIZE') return 'CAN_USE'
  if (currentMastery === 'CAN_USE') return 'PROFICIENT'
  return 'PROFICIENT'
}
