import { useAppStore } from '../store/appStore'

export function SettingsView() {
  const translation = useAppStore((s) => s.translation)
  const setTranslation = useAppStore((s) => s.setTranslation)

  return (
    <div className="settings-view">
      <h1>Settings</h1>

      <section className="settings-section">
        <h2>Translation</h2>
        <div className="settings-radio-group">
          <label>
            <input
              type="radio"
              name="translation"
              checked={translation === 'ESV'}
              onChange={() => setTranslation('ESV')}
            />
            ESV (English Standard Version)
          </label>
          <label>
            <input
              type="radio"
              name="translation"
              checked={translation === 'MSG'}
              onChange={() => setTranslation('MSG')}
            />
            The Message
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h2>About</h2>
        <p>
          Bible text is fetched live from ESV API and api.bible on demand and is never stored
          permanently, per translation licensing terms. Your notes, drawings, and reading
          progress sync privately through your own Cloudflare Worker + D1 database.
        </p>
      </section>
    </div>
  )
}
