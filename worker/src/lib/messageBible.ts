import type { PassageVerse } from './types'
import { USFM_CODES } from './usfm'

const API_BIBLE_BASE = 'https://api.scripture.api.bible/v1'

// The Message (MSG) bible ID on api.bible. Confirm/replace once api.bible access
// is approved — bible IDs are assigned per-account, not a fixed constant.
const MSG_BIBLE_ID = '65eec8e0b60e656b-01'

function parseVerseSpans(content: string): PassageVerse[] {
  // api.bible's text content-type returns verse markers like "[1] text [2] text".
  const verses: PassageVerse[] = []
  const matches = [...content.matchAll(/\[(\d+)\]/g)]
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const verseNum = Number(match[1])
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length
    const text = content.slice(start, end).replace(/\s+/g, ' ').trim()
    if (text) verses.push({ verse: verseNum, text })
  }
  return verses
}

export async function fetchMessagePassage(
  book: string,
  chapter: number,
  apiKey: string,
): Promise<PassageVerse[]> {
  const usfm = USFM_CODES[book]
  if (!usfm) throw new Error(`Unknown book for api.bible lookup: ${book}`)

  const chapterId = `${usfm}.${chapter}`
  const params = new URLSearchParams({
    'content-type': 'text',
    'include-verse-numbers': 'true',
    'include-titles': 'false',
    'include-chapter-numbers': 'false',
    'include-notes': 'false',
  })

  const res = await fetch(
    `${API_BIBLE_BASE}/bibles/${MSG_BIBLE_ID}/chapters/${chapterId}?${params}`,
    { headers: { 'api-key': apiKey } },
  )

  if (!res.ok) {
    throw new Error(`api.bible error ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as { data?: { content?: string } }
  const content = data.data?.content ?? ''
  return parseVerseSpans(content)
}
