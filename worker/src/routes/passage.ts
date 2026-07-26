import type { Env } from '../env'
import type { Passage } from '../lib/types'
import { fetchEsvPassage } from '../lib/esv'
import { fetchMessagePassage } from '../lib/messageBible'

// Short-TTL cache only — ESV and api.bible terms forbid persisting passage text.
// This is a rolling cache of recently-viewed chapters, not a Bible store.
const CACHE_TTL_SECONDS = 60 * 60 // 1 hour

export async function handlePassage(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const book = url.searchParams.get('book')
  const chapterParam = url.searchParams.get('chapter')
  const translation = (url.searchParams.get('translation') ?? 'ESV').toUpperCase()

  if (!book || !chapterParam) {
    return Response.json({ error: 'book and chapter are required' }, { status: 400 })
  }
  const chapter = Number(chapterParam)
  if (!Number.isInteger(chapter) || chapter < 1) {
    return Response.json({ error: 'chapter must be a positive integer' }, { status: 400 })
  }
  if (translation !== 'ESV' && translation !== 'MSG') {
    return Response.json({ error: 'translation must be ESV or MSG' }, { status: 400 })
  }

  const cacheKey = `passage:${translation}:${book}:${chapter}`
  const cached = await env.PASSAGE_CACHE.get(cacheKey, 'json')
  if (cached) {
    return Response.json(cached, { headers: { 'X-Cache': 'HIT' } })
  }

  try {
    const verses =
      translation === 'ESV'
        ? await fetchEsvPassage(book, chapter, requireKey(env.ESV_API_KEY, 'ESV_API_KEY'))
        : await fetchMessagePassage(book, chapter, requireKey(env.BIBLE_API_KEY, 'BIBLE_API_KEY'))

    const passage: Passage = { book, chapter, translation: translation as 'ESV' | 'MSG', verses }

    await env.PASSAGE_CACHE.put(cacheKey, JSON.stringify(passage), {
      expirationTtl: CACHE_TTL_SECONDS,
    })

    return Response.json(passage, { headers: { 'X-Cache': 'MISS' } })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch passage' },
      { status: 502 },
    )
  }
}

function requireKey(key: string | undefined, name: string): string {
  if (!key) throw new Error(`${name} is not configured on this Worker`)
  return key
}
