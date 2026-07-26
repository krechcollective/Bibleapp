import type { PlanDay } from './api'

export interface PlanChapterEntry {
  key: string
  book: string
  chapter: number
  day: number
  date: string
  completed: boolean
  /** True for the chapter that starts this day's reading — where the divider renders. */
  isFirstOfDay: boolean
}

/** Flattens a reading plan's days into one ordered list of chapters, in plan order. */
export function flattenPlanDays(days: PlanDay[]): PlanChapterEntry[] {
  const list: PlanChapterEntry[] = []
  for (const d of days) {
    d.passages.forEach((p, i) => {
      list.push({
        key: `day${d.day}-${i}-${p.book}-${p.chapter}`,
        book: p.book,
        chapter: p.chapter,
        day: d.day,
        date: d.date,
        completed: d.completed,
        isFirstOfDay: i === 0,
      })
    })
  }
  return list
}
