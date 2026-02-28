import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { useLocation } from 'react-router-dom'
import { createSlugger, extractText } from '../utils/slugifyHeading.js'

function MarkdownPage({ title, source, variant = 'panel' }) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  const slugger = useMemo(() => createSlugger(), [content])

  const scrollToHash = () => {
    const hash = location.hash?.replace('#', '')
    if (!hash) {
      return
    }

    let target = document.getElementById(hash)
    if (!target) {
      const headingMatch = hash.match(/^([a-z0-9-]+?)(?:-\d+)?$/)
      const base = headingMatch?.[1] || hash
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      const regex = new RegExp(`^${base}(?:-\\d+)?$`)
      target = headings.find((heading) => regex.test(heading.id))
    }
    if (!target) {
      return
    }

    // Open any collapsed <details> parents so the heading/spell is visible.
    let current = target.parentElement
    while (current) {
      if (current.tagName?.toLowerCase() === 'details') {
        current.open = true
      }
      current = current.parentElement
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    fetch(source)
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) {
          const normalized = text.replace(/\r\n/g, '\n')
          const cleaned = normalized
            .replace(/\*\*Nav:[\s\S]*?\n\n/gi, '')
            .replace(/\*\*On this page:[\s\S]*?\n\n/gi, '')
            .replace(/>\s*💡[\s\S]*?\n\n/gi, '')
            .replace(/<!--\s*PRIVATE[\s\S]*?-->/gi, '')
          setContent(cleaned)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setContent('Unable to load content.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [source])

  useEffect(() => {
    if (isLoading) {
      return
    }

    // Allow the DOM to paint before scrolling.
    const handle = window.setTimeout(scrollToHash, 0)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, content, location.pathname, location.hash])

  const markdownBody = (
    <div className="page-panel__content">
      {isLoading ? (
        <div className="page-panel__loading">Loading...</div>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: (props) => {
              const id = slugger.slug(extractText(props.children))
              return <h1 id={id} {...props} />
            },
            h2: (props) => {
              const id = slugger.slug(extractText(props.children))
              return <h2 id={id} {...props} />
            },
            h3: (props) => {
              const id = slugger.slug(extractText(props.children))
              return <h3 id={id} {...props} />
            },
            h4: (props) => {
              const id = slugger.slug(extractText(props.children))
              return <h4 id={id} {...props} />
            },
            h5: (props) => {
              const id = slugger.slug(extractText(props.children))
              return <h5 id={id} {...props} />
            },
            h6: (props) => {
              const id = slugger.slug(extractText(props.children))
              return <h6 id={id} {...props} />
            },
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  )

  if (variant === 'embedded') {
    return markdownBody
  }

  return (
    <section className="page-panel">
      {title && (
        <header className="page-panel__header">
          <h2>{title}</h2>
        </header>
      )}
      {markdownBody}
    </section>
  )
}

export default MarkdownPage