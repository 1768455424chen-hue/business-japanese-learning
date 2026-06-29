import type { LearningItem, ReviewRecord } from '../types'

const today = new Date().toISOString().split('T')[0]

export function getDueItems(items: LearningItem[]): LearningItem[] {
  return items
    .filter((item) => !item.archived && item.nextReviewDate <= today)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))
}

export function getDueCount(items: LearningItem[]): number {
  return getDueItems(items).length
}

export function calculateNextReviewDate(
  mastery: LearningItem['mastery'],
  result: ReviewRecord['result']
): string {
  const d = new Date()
  if (result === 'incorrect' || result === 'skip') {
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }
  // correct
  switch (mastery) {
    case 'RECOGNIZE':
      d.setDate(d.getDate() + 3)
      break
    case 'CAN_USE':
      d.setDate(d.getDate() + 7)
      break
    case 'PROFICIENT':
      d.setDate(d.getDate() + 30)
      break
  }
  return d.toISOString().split('T')[0]
}
