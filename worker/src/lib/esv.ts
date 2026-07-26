import type { PassageVerse } from './types'

const ESV_API_BASE = 'https://api.esv.org/v3/passage/text/'

/**
 * Splits ESV's `[n]` verse-number markup into discrete verses. The ESV API has no
 * verse-by-verse JSON endpoint on the free tier, so we ask for inline verse numbers
 * and parse them back out here.
 */
function parseEsvText(raw: string): PassageVerse[] {
  const verses: PassageVerse[] = []
  const matches = [...raw.matchAll(/\[(\d+)\]/g)]
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const verseNum = Number(match[1])
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length
    const text = raw
      .slice(start, end)
      .replace(/\s+/g, ' ')
      .trim()
    if (text) verses.push({ verse: verseNum, text })
  }
  return verses
}

export async function fetchEsvPassage(
  book: string,
  chapter: number,
  apiKey: string,
): Promise<PassageVerse[]> {
  const params = new URLSearchParams({
    q: `${book} ${chapter}`,
    'include-headings': 'false',
    'include-footnotes': 'false',
    'include-footnote-body': 'false',
    'include-verse-numbers': 'true',
    'include-short-copyright': 'false',
    'include-passage-references': 'false',
    'indent-paragraphs': '0',
    'indent-poetry': 'false',
  })

  const res = await fetch(`${ESV_API_BASE}?${params}`, {
    headers: { Authorization: `Token ${apiKey}` },
  })

  if (!res.ok) {
    throw new Error(`ESV API error ${res.status}: ${await res.text()}`)
  }

  const data = (await res.json()) as { passages?: string[] }
  const raw = data.passages?.[0] ?? ''
  return parseEsvText(raw)
}
