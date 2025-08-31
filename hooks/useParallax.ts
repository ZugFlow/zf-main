import { useEffect, useRef, useState } from 'react'

interface ParallaxOptions {
  speed?: number
  enabled?: boolean
}

export const useParallax = (options: ParallaxOptions = {}) => {
  const { speed = 0.5, enabled = true } = options
  const elementRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      if (!elementRef.current) return

      const rect = elementRef.current.getBoundingClientRect()
      const scrolled = window.pageYOffset
      const rate = scrolled * -speed
      
      setOffset(rate)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, enabled])

  return { elementRef, offset }
}

export const useParallaxBackground = (imageUrl: string, options: ParallaxOptions = {}) => {
  const { speed = 0.5, enabled = true } = options
  const elementRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')

  useEffect(() => {
    if (!enabled || !imageUrl) return

    const handleScroll = () => {
      if (!elementRef.current) return

      const scrolled = window.pageYOffset
      const rate = scrolled * speed
      
      setTransform(`translateY(${rate}px)`)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, enabled, imageUrl])

  return { elementRef, transform }
}
