import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

function MarkdownPage({ title, source, variant = 'panel' }) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    fetch(source)
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) {
          const cleaned = text
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

  const markdownBody = (
    <div className="page-panel__content">
      {isLoading ? (
        <div className="page-panel__loading">Loading...</div>
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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