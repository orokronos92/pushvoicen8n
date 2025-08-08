import { useState, useEffect, useCallback, useRef } from 'react'
import { verifyToken, getTokenTimeRemaining, JWTPayload } from '@/lib/auth'

interface SessionState {
  isActive: boolean
  token: string | null
  sessionId: string | null
  timeRemaining: number
  userId: string
}

export function useSession(userId: string = 'user_123') {
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    token: null,
    sessionId: null,
    timeRemaining: 0,
    userId,
  })
  
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Start a new session
  const startSession = useCallback(async () => {
    try {
      // Appeler l'API pour générer le token côté serveur
      const response = await fetch('/api/session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      
      if (!response.ok) {
        console.error('Failed to generate token from API')
        return false
      }
      
      const data = await response.json()
      
      if (!data.success || !data.token) {
        console.error('Invalid response from API')
        return false
      }
      
      setSession(prev => ({
        ...prev,
        isActive: true,
        token: data.token,
        sessionId: data.sessionId,
        timeRemaining: 300, // 5 minutes
      }))
      
      // Set up session timeout
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current)
      }
      
      sessionTimerRef.current = setTimeout(() => {
        endSession()
      }, 300000) // 5 minutes
      
      return true
    } catch (error) {
      console.error('Failed to start session:', error)
      return false
    }
  }, [userId])

  // End the current session
  const endSession = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
    
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current)
      tokenRefreshTimerRef.current = null
    }
    
    setSession(prev => ({
      ...prev,
      isActive: false,
      token: null,
      sessionId: null,
      timeRemaining: 0,
    }))
  }, [])

  // Validate session and update activity
  const validateAndUpdateSession = useCallback(async () => {
    if (!session.token) return false
    
    try {
      const payload = await verifyToken(session.token)
      if (payload) {
        // Update time remaining from token
        const timeRemaining = getTokenTimeRemaining(session.token)
        setSession(prev => ({
          ...prev,
          timeRemaining,
        }))
        return true
      } else {
        endSession()
        return false
      }
    } catch (error) {
      console.error('Failed to validate session:', error)
      endSession()
      return false
    }
  }, [session.token, endSession])

  // Update session activity
  const updateActivity = useCallback(() => {
    if (!session.isActive) return false
    
    try {
      // Activity is tracked by token validation
      // Just update the time remaining
      if (session.token) {
        const timeRemaining = getTokenTimeRemaining(session.token)
        setSession(prev => ({
          ...prev,
          timeRemaining,
        }))
      }
      return true
    } catch (error) {
      console.error('Failed to update session activity:', error)
      return false
    }
  }, [session.isActive, session.token])

  // Update session time remaining
  const updateTimeRemaining = useCallback((time: number) => {
    setSession(prev => ({
      ...prev,
      timeRemaining: time,
    }))
  }, [])

  // Auto-refresh token and update time remaining
  useEffect(() => {
    if (!session.isActive || !session.token) return
    
    const updateTimer = () => {
      if (session.token) {
        const timeRemaining = getTokenTimeRemaining(session.token)
        setSession(prev => ({
          ...prev,
          timeRemaining,
        }))
        
        // End session if expired
        if (timeRemaining <= 0) {
          endSession()
        }
      }
    }
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => {
      clearInterval(interval)
    }
  }, [session.isActive, session.token, endSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current)
      }
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current)
      }
    }
  }, [])

  return {
    session,
    startSession,
    endSession,
    validateAndUpdateSession,
    updateActivity,
    updateTimeRemaining,
  }
}