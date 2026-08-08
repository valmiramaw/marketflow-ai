'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return

    function onScroll() {
      setVisible((main as HTMLElement).scrollTop > 400)
    }

    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-card/90 backdrop-blur-sm"
      onClick={() => {
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      aria-label="Nach oben scrollen"
    >
      <ArrowUp className="w-4 h-4" />
    </Button>
  )
}
