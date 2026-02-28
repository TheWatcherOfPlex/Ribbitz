// Lightweight, GitHub-ish slugify used for in-page anchors.
// We keep this local so the dashboard can link into Markdown pages reliably.

export function slugifyHeading(input) {
  if (!input) return ''

  return String(input)
    .normalize('NFKD')
    // Remove emoji + most symbol chars
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    // Convert & to 'and' to match common slug patterns
    .replace(/&/g, ' and ')
    .toLowerCase()
    // Remove quotes/apostrophes
    .replace(/['’]/g, '')
    // Replace anything not alphanumeric with a dash
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse repeats and trim
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createSlugger() {
  const counts = new Map()

  return {
    slug(value) {
      const base = slugifyHeading(value)
      if (!base) return ''

      const current = counts.get(base) || 0
      counts.set(base, current + 1)

      if (current === 0) return base
      return `${base}-${current + 1}`
    },
  }
}

export function extractText(nodeOrNodes) {
  if (nodeOrNodes == null) return ''
  if (typeof nodeOrNodes === 'string' || typeof nodeOrNodes === 'number') {
    return String(nodeOrNodes)
  }
  if (Array.isArray(nodeOrNodes)) {
    return nodeOrNodes.map(extractText).join('')
  }
  if (typeof nodeOrNodes === 'object' && 'props' in nodeOrNodes) {
    return extractText(nodeOrNodes.props?.children)
  }
  return ''
}
