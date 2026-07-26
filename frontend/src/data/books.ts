export interface BookInfo {
  name: string
  /** Short code used in API passage references, e.g. "Gen", "1Cor". */
  code: string
  chapters: number
  testament: 'OT' | 'NT'
}

// Chapter counts per book (Protestant canon, 66 books, 1189 chapters total).
export const BOOKS: BookInfo[] = [
  { name: 'Genesis', code: 'Gen', chapters: 50, testament: 'OT' },
  { name: 'Exodus', code: 'Exod', chapters: 40, testament: 'OT' },
  { name: 'Leviticus', code: 'Lev', chapters: 27, testament: 'OT' },
  { name: 'Numbers', code: 'Num', chapters: 36, testament: 'OT' },
  { name: 'Deuteronomy', code: 'Deut', chapters: 34, testament: 'OT' },
  { name: 'Joshua', code: 'Josh', chapters: 24, testament: 'OT' },
  { name: 'Judges', code: 'Judg', chapters: 21, testament: 'OT' },
  { name: 'Ruth', code: 'Ruth', chapters: 4, testament: 'OT' },
  { name: '1 Samuel', code: '1Sam', chapters: 31, testament: 'OT' },
  { name: '2 Samuel', code: '2Sam', chapters: 24, testament: 'OT' },
  { name: '1 Kings', code: '1Kgs', chapters: 22, testament: 'OT' },
  { name: '2 Kings', code: '2Kgs', chapters: 25, testament: 'OT' },
  { name: '1 Chronicles', code: '1Chr', chapters: 29, testament: 'OT' },
  { name: '2 Chronicles', code: '2Chr', chapters: 36, testament: 'OT' },
  { name: 'Ezra', code: 'Ezra', chapters: 10, testament: 'OT' },
  { name: 'Nehemiah', code: 'Neh', chapters: 13, testament: 'OT' },
  { name: 'Esther', code: 'Esth', chapters: 10, testament: 'OT' },
  { name: 'Job', code: 'Job', chapters: 42, testament: 'OT' },
  { name: 'Psalms', code: 'Ps', chapters: 150, testament: 'OT' },
  { name: 'Proverbs', code: 'Prov', chapters: 31, testament: 'OT' },
  { name: 'Ecclesiastes', code: 'Eccl', chapters: 12, testament: 'OT' },
  { name: 'Song of Solomon', code: 'Song', chapters: 8, testament: 'OT' },
  { name: 'Isaiah', code: 'Isa', chapters: 66, testament: 'OT' },
  { name: 'Jeremiah', code: 'Jer', chapters: 52, testament: 'OT' },
  { name: 'Lamentations', code: 'Lam', chapters: 5, testament: 'OT' },
  { name: 'Ezekiel', code: 'Ezek', chapters: 48, testament: 'OT' },
  { name: 'Daniel', code: 'Dan', chapters: 12, testament: 'OT' },
  { name: 'Hosea', code: 'Hos', chapters: 14, testament: 'OT' },
  { name: 'Joel', code: 'Joel', chapters: 3, testament: 'OT' },
  { name: 'Amos', code: 'Amos', chapters: 9, testament: 'OT' },
  { name: 'Obadiah', code: 'Obad', chapters: 1, testament: 'OT' },
  { name: 'Jonah', code: 'Jonah', chapters: 4, testament: 'OT' },
  { name: 'Micah', code: 'Mic', chapters: 7, testament: 'OT' },
  { name: 'Nahum', code: 'Nah', chapters: 3, testament: 'OT' },
  { name: 'Habakkuk', code: 'Hab', chapters: 3, testament: 'OT' },
  { name: 'Zephaniah', code: 'Zeph', chapters: 3, testament: 'OT' },
  { name: 'Haggai', code: 'Hag', chapters: 2, testament: 'OT' },
  { name: 'Zechariah', code: 'Zech', chapters: 14, testament: 'OT' },
  { name: 'Malachi', code: 'Mal', chapters: 4, testament: 'OT' },
  { name: 'Matthew', code: 'Matt', chapters: 28, testament: 'NT' },
  { name: 'Mark', code: 'Mark', chapters: 16, testament: 'NT' },
  { name: 'Luke', code: 'Luke', chapters: 24, testament: 'NT' },
  { name: 'John', code: 'John', chapters: 21, testament: 'NT' },
  { name: 'Acts', code: 'Acts', chapters: 28, testament: 'NT' },
  { name: 'Romans', code: 'Rom', chapters: 16, testament: 'NT' },
  { name: '1 Corinthians', code: '1Cor', chapters: 16, testament: 'NT' },
  { name: '2 Corinthians', code: '2Cor', chapters: 13, testament: 'NT' },
  { name: 'Galatians', code: 'Gal', chapters: 6, testament: 'NT' },
  { name: 'Ephesians', code: 'Eph', chapters: 6, testament: 'NT' },
  { name: 'Philippians', code: 'Phil', chapters: 4, testament: 'NT' },
  { name: 'Colossians', code: 'Col', chapters: 4, testament: 'NT' },
  { name: '1 Thessalonians', code: '1Thess', chapters: 5, testament: 'NT' },
  { name: '2 Thessalonians', code: '2Thess', chapters: 3, testament: 'NT' },
  { name: '1 Timothy', code: '1Tim', chapters: 6, testament: 'NT' },
  { name: '2 Timothy', code: '2Tim', chapters: 4, testament: 'NT' },
  { name: 'Titus', code: 'Titus', chapters: 3, testament: 'NT' },
  { name: 'Philemon', code: 'Phlm', chapters: 1, testament: 'NT' },
  { name: 'Hebrews', code: 'Heb', chapters: 13, testament: 'NT' },
  { name: 'James', code: 'Jas', chapters: 5, testament: 'NT' },
  { name: '1 Peter', code: '1Pet', chapters: 5, testament: 'NT' },
  { name: '2 Peter', code: '2Pet', chapters: 3, testament: 'NT' },
  { name: '1 John', code: '1John', chapters: 5, testament: 'NT' },
  { name: '2 John', code: '2John', chapters: 1, testament: 'NT' },
  { name: '3 John', code: '3John', chapters: 1, testament: 'NT' },
  { name: 'Jude', code: 'Jude', chapters: 1, testament: 'NT' },
  { name: 'Revelation', code: 'Rev', chapters: 22, testament: 'NT' },
]

export interface ChapterRef {
  book: string
  bookIndex: number
  chapter: number
  /** 0-based index into the flattened list of all 1189 chapters. */
  globalIndex: number
}

export const ALL_CHAPTERS: ChapterRef[] = (() => {
  const list: ChapterRef[] = []
  BOOKS.forEach((b, bookIndex) => {
    for (let chapter = 1; chapter <= b.chapters; chapter++) {
      list.push({ book: b.name, bookIndex, chapter, globalIndex: list.length })
    }
  })
  return list
})()

export function chapterRefFor(bookName: string, chapter: number): ChapterRef | undefined {
  return ALL_CHAPTERS.find((c) => c.book === bookName && c.chapter === chapter)
}

export function bookByName(name: string): BookInfo | undefined {
  return BOOKS.find((b) => b.name === name)
}
