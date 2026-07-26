import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ALL_CHAPTERS, chapterRefFor } from '../data/books'
import { ChapterView } from './ChapterView'
import { useAppStore } from '../store/appStore'
import { api, type PlanDay } from '../lib/api'
import { flattenPlanDays, type PlanChapterEntry } from '../lib/planUtils'

interface SequenceItem {
  key: string
  book: string
  chapter: number
  dayDivider?: string
  onDayComplete?: () => void
}

export function Reader() {
  const parentRef = useRef<HTMLDivElement>(null)
  const readingMode = useAppStore((s) => s.readingMode)
  const currentBook = useAppStore((s) => s.currentBook)
  const currentChapter = useAppStore((s) => s.currentChapter)
  const setPosition = useAppStore((s) => s.setPosition)
  const planIndex = useAppStore((s) => s.planIndex)
  const setPlanIndex = useAppStore((s) => s.setPlanIndex)
  const pendingPlanDay = useAppStore((s) => s.pendingPlanDay)
  const setPendingPlanDay = useAppStore((s) => s.setPendingPlanDay)

  const [days, setDays] = useState<PlanDay[]>([])

  useEffect(() => {
    api
      .getPlan()
      .then(setDays)
      .catch(() => setDays([]))
  }, [])

  const flattenedPlan = useMemo(() => flattenPlanDays(days), [days])

  async function toggleDay(entry: PlanChapterEntry) {
    const completed = !entry.completed
    setDays((prev) => prev.map((d) => (d.day === entry.day ? { ...d, completed } : d)))
    await api.markDayComplete(entry.day, completed).catch(() => {})
  }

  const sequence: SequenceItem[] = useMemo(() => {
    if (readingMode === 'plan') {
      return flattenedPlan.map((entry) => ({
        key: entry.key,
        book: entry.book,
        chapter: entry.chapter,
        dayDivider: entry.isFirstOfDay
          ? `Day ${entry.day} — ${entry.date}${entry.completed ? ' ✓' : ''}`
          : undefined,
        onDayComplete: entry.isFirstOfDay ? () => toggleDay(entry) : undefined,
      }))
    }
    return ALL_CHAPTERS.map((ref) => ({ key: `${ref.book}-${ref.chapter}`, book: ref.book, chapter: ref.chapter }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingMode, flattenedPlan])

  const virtualizer = useVirtualizer({
    count: sequence.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 900,
    overscan: 2,
  })

  // Scroll to the right spot whenever the mode switches (or the plan finishes loading).
  const lastScrolledMode = useRef<string | null>(null)
  useEffect(() => {
    if (sequence.length === 0) return

    // Chapters vary wildly in height (Psalm 119 vs. Obadiah), so scrollToIndex on
    // unmeasured items lands imprecisely — the virtualizer corrects its size
    // estimates right after, which can shift the scroll position. Re-issuing the
    // same scrollToIndex a frame later (the standard TanStack Virtual fix for
    // variable-size lists) re-aligns it once real measurements are in.
    function scrollToWithCorrection(idx: number, attemptsLeft = 5) {
      virtualizer.scrollToIndex(idx, { align: 'start' })
      if (attemptsLeft > 0) {
        requestAnimationFrame(() => scrollToWithCorrection(idx, attemptsLeft - 1))
      }
    }

    if (readingMode === 'plan') {
      if (pendingPlanDay != null) {
        const idx = flattenedPlan.findIndex((e) => e.day === pendingPlanDay)
        if (idx >= 0) {
          scrollToWithCorrection(idx)
          setPlanIndex(idx)
        }
        setPendingPlanDay(null)
        lastScrolledMode.current = readingMode
        return
      }
      if (lastScrolledMode.current !== 'plan') {
        const idx = Math.min(planIndex, sequence.length - 1)
        scrollToWithCorrection(idx)
        lastScrolledMode.current = 'plan'
      }
    } else {
      if (lastScrolledMode.current !== 'canonical') {
        const ref = chapterRefFor(currentBook, currentChapter)
        if (ref) scrollToWithCorrection(ref.globalIndex)
        lastScrolledMode.current = 'canonical'
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingMode, sequence.length, pendingPlanDay])

  // Track which chapter is topmost in view and persist it as "current position".
  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const items = virtualizer.getVirtualItems()
        const first = items.find((i) => i.start >= el.scrollTop - 50) ?? items[0]
        if (!first) return
        const item = sequence[first.index]
        if (!item) return
        if (item.book !== currentBook || item.chapter !== currentChapter) {
          setPosition(item.book, item.chapter)
        }
        if (readingMode === 'plan') {
          setPlanIndex(first.index)
        }
      })
    }
    el.addEventListener('scroll', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualizer, sequence, readingMode])

  const items = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="reader-scroll">
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {items.map((item) => {
          const entry = sequence[item.index]
          if (!entry) return null
          return (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${item.start}px)`,
              }}
            >
              <ChapterView
                book={entry.book}
                chapter={entry.chapter}
                dayDivider={entry.dayDivider}
                onDayComplete={entry.onDayComplete}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
