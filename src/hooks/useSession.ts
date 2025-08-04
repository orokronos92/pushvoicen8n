import { useState, useEffect, useCallback, useRef } from 'react'
import { createSession, validateSession, endSession as authEndSession, updateSessionActivity, SessionInfo } from '@/lib/auth'

interface SessionState {
  isActive: boolean
  token: string | null
  sessionId: string | null
  timeRemaining: number
  userId: string
  sessionInfo: SessionInfo | null
}

export function useSession(userId: string = 'user_123') {
  const [session, setSession] = useState<SessionState>({
    isActive: false,
    token: null,
    sessionId: null,
    timeRemaining: 0,
    userId,
    sessionInfo: null,
  })
  
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Start a new session
  const startSession = useCallback(() => {
    try {
      const result = createSession(userId)
      if (!result) {
        console.error('Failed to create session')
        return false
      }
      
      const { token, sessionInfo } = result
      
      setSession(prev => ({
        ...prev,
        isActive: true,
        token,
        sessionId: sessionInfo.sessionId,
        timeRemaining: 300, // 5 minutes
        sessionInfo,
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
    if (session.sessionId) {
      // End session in the session store
      try {
        authEndSession(session.sessionId)
      } catch (error) {
        console.error('Failed to end session in store:', error)
      }
    }
    
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
      sessionInfo: null,
    }))
  }, [session.sessionId])

  // Validate session and update activity
  const validateAndUpdateSession = useCallback(() => {
    if (!session.token) return false
    
    try {
      const validation = validateSession(session.token)
      if (validation.valid && validation.sessionInfo) {
        setSession(prev => ({
          ...prev,
          sessionInfo: validation.sessionInfo || null,
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
    if (!session.sessionId) return false
    
    try {
      const success = updateSessionActivity(session.sessionId)
      if (success && session.sessionInfo) {
        // Update local session info
        const updatedSessionInfo = { ...session.sessionInfo, lastActivity: new Date() }
        setSession(prev => ({
          ...prev,
          sessionInfo: updatedSessionInfo,
        }))
      }
      return success
    } catch (error) {
      console.error('Failed to update session activity:', error)
      return false
    }
  }, [session.sessionId, session.sessionInfo])

  // Update session time remaining
  const updateTimeRemaining = useCallback((time: number) => {
    setSession(prev => ({
      ...prev,
      timeRemaining: time,
    }))
  }, [])

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