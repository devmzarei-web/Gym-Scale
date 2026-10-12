"use client"

import { useEffect, useRef } from "react"

interface AutoPrintTriggerProps {
  delay?: number
}

export function AutoPrintTrigger({ delay = 600 }: AutoPrintTriggerProps) {
  const printedRef = useRef(false)

  useEffect(() => {
    if (printedRef.current) return
    printedRef.current = true

    const timer = setTimeout(() => {
      try {
        window.print()
      } catch (err) {
        console.warn("Auto-print invocation failed:", err)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return null
}
