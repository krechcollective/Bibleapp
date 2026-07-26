import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { JumpTo } from './JumpTo'
import { NotesPanel } from './NotesPanel'
import { useAppStore } from '../store/appStore'

export function Layout() {
  const [jumpOpen, setJumpOpen] = useState(false)
  const translation = useAppStore((s) => s.translation)
  const setTranslation = useAppStore((s) => s.setTranslation)
  const currentBook = useAppStore((s) => s.currentBook)
  const currentChapter = useAppStore((s) => s.currentChapter)
  const setPosition = useAppStore((s) => s.setPosition)
  const notesPanelOpen = useAppStore((s) => s.notesPanelOpen)
  const toggleNotesPanel = useAppStore((s) => s.toggleNotesPanel)

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="header-btn jump-btn" onClick={() => setJumpOpen(true)}>
          {currentBook} {currentChapter} ▾
        </button>

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
          <button className="header-btn notes-toggle" onClick={toggleNotesPanel}>
            {notesPanelOpen ? 'Hide notes' : 'Notes'}
          </button>
        </div>
      </header>

      <div className="app-body">
        <main className="app-main">
          <Outlet />
        </main>
        <NotesPanel />
      </div>

      {jumpOpen && (
        <JumpTo
          onJump={(book, chapter) => setPosition(book, chapter)}
          onClose={() => setJumpOpen(false)}
        />
      )}
    </div>
  )
}
