'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'

type RevealProps = {
  children: ReactNode
  /** Jeda sebelum animasi mulai (ms), dipakai untuk efek berurutan */
  delay?: number
  variant?: 'up' | 'left' | 'right' | 'zoom'
  as?: ElementType
  className?: string
}

/**
 * Memunculkan elemen dengan animasi saat masuk viewport.
 * Kalau splash screen sedang tampil, animasi menunggu event `splash:done`.
 */
export default function Reveal({
  children,
  delay = 0,
  variant = 'up',
  as: Tag = 'div',
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let io: IntersectionObserver | null = null

    const observe = () => {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setShown(true)
            io?.disconnect()
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -5% 0px' },
      )
      io.observe(el)
    }

    if (document.documentElement.dataset.splash === 'on') {
      window.addEventListener('splash:done', observe, { once: true })
    } else {
      observe()
    }

    return () => {
      window.removeEventListener('splash:done', observe)
      io?.disconnect()
    }
  }, [])

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}