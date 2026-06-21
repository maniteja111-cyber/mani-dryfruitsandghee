'use client'

import { useEffect } from 'react'

interface ConfettiProps {
  show: boolean
  duration?: number
}

export default function Confetti({ show, duration = 3000 }: ConfettiProps) {
  useEffect(() => {
    if (!show) return
    
    const colors = ['#FFD60A', '#f59e0b', '#fbbf24', '#fde68a', '#fff7ed']
    const count = 100
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100vw'
    container.style.height = '100vh'
    container.style.pointerEvents = 'none'
    container.style.zIndex = '9999'
    document.body.appendChild(container)
    
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div')
      confetti.style.position = 'absolute'
      confetti.style.width = `${Math.random() * 10 + 5}px`
      confetti.style.height = `${Math.random() * 10 + 5}px`
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.borderRadius = '50%'
      confetti.style.left = `${Math.random() * 100}%`
      confetti.style.top = `${Math.random() * 20}%`
      container.appendChild(confetti)
      
      const anim = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], { duration: 3000 + Math.random() * 2000 })
      
      anim.onfinish = () => confetti.remove()
    }
    
    const timer = setTimeout(() => {
      container.remove()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [show, duration])
  
  return null
}