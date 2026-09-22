import { useEffect, useState } from 'react'
import { THEMES, applyThemeId, loadThemeId, saveThemeId } from '../dashboard/themes.js'

export default function ThemeSwitcher({ characterId }) {
  const [themeId, setThemeId] = useState(() => loadThemeId(characterId))

  useEffect(() => {
    applyThemeId(themeId)
  }, [themeId])

  const handleChange = (event) => {
    const nextThemeId = event.target.value
    setThemeId(nextThemeId)
    saveThemeId(characterId, nextThemeId)
  }

  return (
    <label className="theme-switcher">
      <span className="theme-switcher__label">Theme</span>
      <select className="theme-switcher__select" value={themeId} onChange={handleChange}>
        {THEMES.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  )
}
