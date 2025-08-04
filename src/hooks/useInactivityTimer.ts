import { useEffect, useRef, useCallback } from 'react'

interface UseInactivityTimerOptions {
  timeout: number // in milliseconds
  onTimeout: () => void
  events?: string[] // events to listen for
}

export function useInactivityTimer({
  timeout,
  onTimeout,
  events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
}: UseInactivityTimerOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Reset the timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      onTimeout()
    }, timeout)
  }, [timeout, onTimeout])

  // Handle user activity
  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  // Get time remaining until timeout
  const getTimeRemaining = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current
    return Math.max(0, timeout - elapsed)
  }, [timeout])

  // Check if user is inactive
  const isInactive = useCallback(() => {
    return getTimeRemaining() <= 0
  }, [getTimeRemaining])

  // Set up event listeners
  useEffect(() => {
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Start the timer
    resetTimer()

    // Clean up
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [events, handleActivity, resetTimer])

  return {
    resetTimer,
    getTimeRemaining,
    isInactive,
  }
}

// Hook specifically for 5-minute inactivity timeout
export function useSessionInactivity(onTimeout: () => void) {
  return useInactivityTimer({
    timeout: 5 * 60 * 1000, // 5 minutes
    onTimeout,
  })
}