export interface PassageVerse {
  verse: number
  text: string
}

export interface Passage {
  book: string
  chapter: number
  translation: 'ESV' | 'MSG'
  verses: PassageVerse[]
}
