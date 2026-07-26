import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { JumpTo } from './JumpTo'
import { useAppStore } from '../store/appStore'

export function Layout() {
  const [jumpOpen, setJumpOpen] = useState(false)
  const translation = useAppStore((s) => s.translation)
  const setTranslation = useAppStore((s) => s.setTranslation)
  const currentBook = useAppStore((s) => s.currentBook)
  const currentChapter = useAppStore((s) => s.currentChapter)
  const setPosition = useAppStore((s) => s.setPosition)
  const readingMode = useAppStore((s) => s.readingMode)
  const setReadingMode = useAppStore((s) => s.setReadingMode)

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="header-btn jump-btn" onClick={() => setJumpOpen(true)}>
          {currentBook} {currentChapter} ▾
        </button>

        <div className="mode-toggle" title="Reading order">
          <button
            className={readingMode === 'canonical' ? 'mode-toggle-active' : ''}
            onClick={() => setReadingMode('canonical')}
          >
            Bible
          </button>
          <button
            className={readingMode === 'plan' ? 'mode-toggle-active' : ''}
            onClick={() => setReadingMode('plan')}
          >
            Plan
          </button>
        </div>

        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            Read
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            Plan
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            Settings
          </NavLink>
        </nav>

        <div className="header-actions">
          <button
            className="header-btn translation-toggle"
            onClick={() => setTranslation(translation === 'ESV' ? 'MSG' : 'ESV')}
            title="Toggle translation"
          >
            {translation}
          </button>
        </div>
      </header>

      <div className="app-body">
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {jumpOpen && (
        <JumpTo
          onJump={(book, chapter) => {
            setReadingMode('canonical')
            setPosition(book, chapter)
          }}
          onClose={() => setJumpOpen(false)}
        />
      )}
    </div>
  )
}
