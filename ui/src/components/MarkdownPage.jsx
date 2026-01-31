import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MarkdownPage({ title, source }) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    fetch(source)
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) {
          setContent(text)
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

  return (
    <section className="page-panel">
      <header className="page-panel__header">
        <h2>{title}</h2>
      </header>
      <div className="page-panel__content">
        {isLoading ? (
          <div className="page-panel__loading">Loading...</div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        )}
      </div>
    </section>
  )
}

export default MarkdownPage