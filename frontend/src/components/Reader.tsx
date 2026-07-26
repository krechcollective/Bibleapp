import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ALL_CHAPTERS, chapterRefFor } from '../data/books'
import { ChapterView } from './ChapterView'
import { useAppStore } from '../store/appStore'
import { api, type PlanDay } from '../lib/api'

interface DayMarker {
  day: number
  date: string
  completed: boolean
}

export function Reader() {
  const parentRef = useRef<HTMLDivElement>(null)
  const currentBook = useAppStore((s) => s.currentBook)
  const currentChapter = useAppStore((s) => s.currentChapter)
  const setPosition = useAppStore((s) => s.setPosition)

  // Maps "Book|chapter" (of a day's first passage) to that day's divider info.
  const [dayMarkers, setDayMarkers] = useState<Map<string, DayMarker>>(new Map())

  useEffect(() => {
    api
      .getPlan()
      .then((days: PlanDay[]) => {
        const map = new Map<string, DayMarker>()
        for (const d of days) {
          const first = d.passages[0]
          if (!first) continue
          map.set(`${first.book}|${first.chapter}`, { day: d.day, date: d.date, completed: d.completed })
        }
        setDayMarkers(map)
      })
      .catch(() => setDayMarkers(new Map()))
  }, [])

  async function toggleDay(marker: DayMarker) {
    const completed = !marker.completed
    setDayMarkers((prev) => {
      const next = new Map(prev)
      for (const [key, val] of next) {
        if (val.day === marker.day) next.set(key, { ...val, completed })
      }
      return next
    })
    await api.markDayComplete(marker.day, completed).catch(() => {})
  }

  const virtualizer = useVirtualizer({
    count: ALL_CHAPTERS.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 900,
    overscan: 2,
  })

  // Jump to the last-remembered position on first mount.
  const didInitialScroll = useRef(false)
  useEffect(() => {
    if (didInitialScroll.current) return
    const ref = chapterRefFor(currentBook, currentChapter)
    if (ref) {
      didInitialScroll.current = true
      virtualizer.scrollToIndex(ref.globalIndex, { align: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Expose an imperative jump for the JumpTo control via the store's position setter.
  useEffect(() => {
    const ref = chapterRefFor(currentBook, currentChapter)
    if (ref && didInitialScroll.current) {
      virtualizer.scrollToIndex(ref.globalIndex, { align: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook, currentChapter])

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
        if (first) {
          const ref = ALL_CHAPTERS[first.index]
          if (ref && (ref.book !== currentBook || ref.chapter !== currentChapter)) {
            setPosition(ref.book, ref.chapter)
          }
        }
      })
    }
    el.addEventListener('scroll', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualizer])

  const items = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="reader-scroll">
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {items.map((item) => {
          const ref = ALL_CHAPTERS[item.index]
          const marker = dayMarkers.get(`${ref.book}|${ref.chapter}`)
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
                book={ref.book}
                chapter={ref.chapter}
                dayDivider={
                  marker ? `Day ${marker.day} — ${marker.date}${marker.completed ? ' ✓' : ''}` : undefined
                }
                onDayComplete={marker ? () => toggleDay(marker) : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
