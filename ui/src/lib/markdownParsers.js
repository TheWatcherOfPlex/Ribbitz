// Markdown-parsing helpers extracted from App.jsx (Phase 6 cleanup,
// 2026-09-22) — logic unchanged, just relocated. These parse the
// canonical long-form Markdown content pages (spells, magic abilities)
// into structured data for the dashboard panels. See
// docs/REBUILD_PLAN.md §5 "Reusable pieces" — this was flagged there
// back in Phase 3 as a good extraction candidate and finally done here.
import { slugifyHeading } from '../utils/slugifyHeading.js'

export function stripHtml(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractField(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = block.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([^\\n]+)`, 'i'))
  return match ? stripHtml(match[1]) : ''
}

export function extractSection(block, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = block.match(new RegExp(`#### ${escaped}\\n+([\\s\\S]*?)(?=\\n#### |\\n</details>|$)`, 'i'))
  return match ? match[1].trim() : ''
}

export function summarizeMarkdownBlock(markdownText) {
  const cleaned = stripHtml(
    String(markdownText || '')
      .replace(/\*\*At Higher Levels:\*\*[\s\S]*/i, '')
      .replace(/\*\*Spell Lists:\*\*[\s\S]*/i, '')
      .replace(/\*\*/g, ''),
  )
  if (!cleaned) return ''
  return cleaned.length > 360 ? `${cleaned.slice(0, 357).trim()}...` : cleaned
}

export function extractBulletNotes(markdownText) {
  return String(markdownText || '')
    .split('\n')
    .map((line) => stripHtml(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '')))
    .filter(Boolean)
}

export function parsePreparedSpellsIndex(markdownText) {
  const normalized = String(markdownText || '').replace(/\r\n/g, '\n')
  const index = {}

  // Find each level section (summary/h2)
  const sectionRegex = /<summary><h2>([\s\S]*?)<\/h2><\/summary>/g
  const sections = []
  let match
  while ((match = sectionRegex.exec(normalized))) {
    sections.push({
      titleHtml: match[1],
      start: match.index,
      end: sectionRegex.lastIndex,
    })
  }

  for (let i = 0; i < sections.length; i += 1) {
    const current = sections[i]
    const next = sections[i + 1]
    const block = normalized.slice(current.end, next?.start ?? normalized.length)

    const title = stripHtml(current.titleHtml)
    const cantrip = /cantrips/i.test(title)
    const levelMatch = title.match(/(\d)(?:st|nd|rd|th)\s+level\s+spells/i)

    if (!cantrip && !levelMatch) {
      continue
    }

    const levelLabel = cantrip ? 'Cantrips' : `${levelMatch[1]}${levelMatch[1] === '1' ? 'st' : levelMatch[1] === '2' ? 'nd' : levelMatch[1] === '3' ? 'rd' : 'th'}`

    const spellRegex = /<summary><h3>([\s\S]*?)<\/h3><\/summary>/g
    const spells = []
    let spellMatch
    while ((spellMatch = spellRegex.exec(block))) {
      const spellName = stripHtml(spellMatch[1])
      if (!spellName) continue
      const spellBlockStart = spellRegex.lastIndex
      const spellBlockEnd = (() => {
        const nextMatch = block.slice(spellBlockStart).match(/<summary><h3>[\s\S]*?<\/h3><\/summary>/)
        return nextMatch ? spellBlockStart + nextMatch.index : block.length
      })()
      const spellBlock = block.slice(spellBlockStart, spellBlockEnd)
      const officialText = extractSection(spellBlock, 'Official Text')
      const ribbitzNotes = extractSection(spellBlock, 'Ribbitz Notes')
      spells.push({
        name: spellName,
        slug: slugifyHeading(spellName),
        level: extractField(spellBlock, 'Level'),
        castingTime: extractField(spellBlock, 'Casting Time'),
        range: extractField(spellBlock, 'Range'),
        components: extractField(spellBlock, 'Components'),
        duration: extractField(spellBlock, 'Duration'),
        source: extractField(spellBlock, 'Source'),
        summary: summarizeMarkdownBlock(officialText),
        notes: extractBulletNotes(ribbitzNotes),
      })
    }

    if (spells.length) {
      index[levelLabel] = spells
    }
  }

  return index
}

// Same shape/parsing approach as parsePreparedSpellsIndex, but for the flat
// "Magic Abilities (Non-Spell)" section (Halo of Spores, Symbiotic Entity,
// etc.) — no per-level grouping, just name -> { summary, notes, subtitle }.
export function parseMagicAbilitiesIndex(markdownText) {
  const normalized = String(markdownText || '').replace(/\r\n/g, '\n')
  const index = {}

  const sectionRegex = /<summary><h2>([\s\S]*?)<\/h2><\/summary>/g
  const sections = []
  let match
  while ((match = sectionRegex.exec(normalized))) {
    sections.push({ titleHtml: match[1], start: match.index, end: sectionRegex.lastIndex })
  }

  const magicSection = sections.find((s) => /magic abilities/i.test(stripHtml(s.titleHtml)))
  if (!magicSection) return index

  const sectionIndex = sections.indexOf(magicSection)
  const next = sections[sectionIndex + 1]
  const block = normalized.slice(magicSection.end, next?.start ?? normalized.length)

  const abilityRegex = /<summary><h3>([\s\S]*?)<\/h3><\/summary>/g
  let abilityMatch
  while ((abilityMatch = abilityRegex.exec(block))) {
    const name = stripHtml(abilityMatch[1])
    if (!name) continue
    const blockStart = abilityRegex.lastIndex
    const blockEnd = (() => {
      const nextMatch = block.slice(blockStart).match(/<summary><h3>[\s\S]*?<\/h3><\/summary>/)
      return nextMatch ? blockStart + nextMatch.index : block.length
    })()
    const abilityBlock = block.slice(blockStart, blockEnd)
    const officialText = extractSection(abilityBlock, 'Official Text')
    const ribbitzNotes = extractSection(abilityBlock, 'Ribbitz Notes')
    // The "**Circle of Spores Feature (Nth level)**" style line right under
    // the heading, if present — shown as a small subtitle.
    const subtitleMatch = abilityBlock.match(/^\s*\*\*([^*]+)\*\*\s*$/m)
    const slug = slugifyHeading(name)
    index[slug] = {
      name,
      slug,
      subtitle: subtitleMatch ? stripHtml(subtitleMatch[1]) : '',
      source: extractField(abilityBlock, 'Source'),
      summary: summarizeMarkdownBlock(officialText),
      notes: extractBulletNotes(ribbitzNotes),
    }
  }

  return index
}
