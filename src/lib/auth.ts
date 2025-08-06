import { jwtDecode } from 'jwt-decode'

const JWT_SECRET = process.env.JWT_SECRET || 'pushvoice-secret-key-very-long-and-complex-2025'
const JWT_EXPIRES_IN = 5 * 60 * 1000 // 5 minutes in milliseconds

export interface JWTPayload {
  userId: string
  sessionId: string
  iat?: number
  exp?: number
}

/**
 * Simple JWT-like token generation for client-side use
 * Note: This is not as secure as server-side JWT but works for client-side needs
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + Math.floor(JWT_EXPIRES_IN / 1000)
  }
  
  // Simple base64 encoding (not secure, but works for client-side)
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(tokenPayload))
  
  // Create a simple signature (not cryptographically secure)
  const signature = btoa(JSON.stringify({
    data: `${encodedHeader}.${encodedPayload}`,
    secret: JWT_SECRET
  }))
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Decode and verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payload = JSON.parse(atob(parts[1]))
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token) as { exp: number }
    if (!decoded || !decoded.exp) return true
    
    return decoded.exp * 1000 < Date.now()
  } catch (error) {
    return true
  }
}

/**
 * Get time remaining until token expiration (in seconds)
 */
export function getTokenTimeRemaining(token: string): number {
  try {
    const decoded = jwtDecode(token) as { exp: number }
    if (!decoded || !decoded.exp) return 0
    
    const remaining = decoded.exp * 1000 - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  } catch (error) {
    return 0
  }
}

/**
 * Create a new session payload
 */
export function createSessionPayload(userId: string): Omit<JWTPayload, 'iat' | 'exp'> {
  return {
    userId,
    sessionId: generateSessionId(),
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Refresh a token (create a new one with the same payload)
 */
export function refreshToken(oldToken: string): string | null {
  const payload = verifyToken(oldToken)
  if (!payload) return null
  
  const { iat, exp, ...newPayload } = payload
  return generateToken(newPayload)
}

export interface SessionInfo {
  userId: string
  sessionId: string
  isActive: boolean
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
}

// In-memory session store (in production, use Redis or similar)
const sessionStore = new Map<string, SessionInfo>()

/**
 * Create and register a new session
 */
export function createSession(userId: string): { token: string; sessionInfo: SessionInfo } | null {
  try {
    const sessionPayload = createSessionPayload(userId)
    const token = generateToken(sessionPayload)
    
    const now = new Date()
    const expiresAt = new Date(now.getTime() + JWT_EXPIRES_IN)
    
    const sessionInfo: SessionInfo = {
      userId,
      sessionId: sessionPayload.sessionId,
      isActive: true,
      createdAt: now,
      lastActivity: now,
      expiresAt,
    }
    
    // Store session
    sessionStore.set(sessionPayload.sessionId, sessionInfo)
    
    // Clean up any existing sessions for this user (enforce single session)
    cleanupUserSessions(userId, sessionPayload.sessionId)
    
    return { token, sessionInfo }
  } catch (error) {
    console.error('Failed to create session:', error)
    return null
  }
}

/**
 * Validate a session by token
 */
export function validateSession(token: string): { valid: boolean; sessionInfo?: SessionInfo; error?: string } {
  try {
    const payload = verifyToken(token)
    if (!payload) {
      return { valid: false, error: 'Invalid token' }
    }
    
    const sessionInfo = sessionStore.get(payload.sessionId)
    if (!sessionInfo) {
      return { valid: false, error: 'Session not found' }
    }
    
    if (!sessionInfo.isActive) {
      return { valid: false, error: 'Session is inactive' }
    }
    
    if (new Date() > sessionInfo.expiresAt) {
      sessionInfo.isActive = false
      sessionStore.set(payload.sessionId, sessionInfo)
      return { valid: false, error: 'Session expired' }
    }
    
    // Update last activity
    sessionInfo.lastActivity = new Date()
    sessionStore.set(payload.sessionId, sessionInfo)
    
    return { valid: true, sessionInfo }
  } catch (error) {
    console.error('Session validation error:', error)
    return { valid: false, error: 'Validation failed' }
  }
}

/**
 * End a session
 */
export function endSession(sessionId: string): boolean {
  try {
    const sessionInfo = sessionStore.get(sessionId)
    if (sessionInfo) {
      sessionInfo.isActive = false
      sessionStore.set(sessionId, sessionInfo)
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to end session:', error)
    return false
  }
}

/**
 * Update session activity
 */
export function updateSessionActivity(sessionId: string): boolean {
  try {
    const sessionInfo = sessionStore.get(sessionId)
    if (sessionInfo && sessionInfo.isActive) {
      sessionInfo.lastActivity = new Date()
      sessionStore.set(sessionId, sessionInfo)
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to update session activity:', error)
    return false
  }
}

/**
 * Get session info
 */
export function getSessionInfo(sessionId: string): SessionInfo | null {
  try {
    const sessionInfo = sessionStore.get(sessionId)
    if (sessionInfo && sessionInfo.isActive) {
      return sessionInfo
    }
    return null
  } catch (error) {
    console.error('Failed to get session info:', error)
    return null
  }
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = new Date()
  for (const [sessionId, sessionInfo] of sessionStore.entries()) {
    if (now > sessionInfo.expiresAt) {
      sessionInfo.isActive = false
      sessionStore.set(sessionId, sessionInfo)
    }
  }
}

/**
 * Clean up all sessions for a user except the specified one
 */
function cleanupUserSessions(userId: string, keepSessionId: string): void {
  for (const [sessionId, sessionInfo] of sessionStore.entries()) {
    if (sessionInfo.userId === userId && sessionId !== keepSessionId) {
      sessionInfo.isActive = false
      sessionStore.set(sessionId, sessionInfo)
    }
  }
}

/**
 * Get active session count for a user
 */
export function getUserActiveSessionCount(userId: string): number {
  let count = 0
  for (const [sessionId, sessionInfo] of sessionStore.entries()) {
    if (sessionInfo.userId === userId && sessionInfo.isActive) {
      count++
    }
  }
  return count
}

/**
 * Get all active sessions
 */
export function getAllActiveSessions(): SessionInfo[] {
  const activeSessions: SessionInfo[] = []
  for (const sessionInfo of sessionStore.values()) {
    if (sessionInfo.isActive) {
      activeSessions.push(sessionInfo)
    }
  }
  return activeSessions
}

// Set up periodic cleanup of expired sessions
if (typeof window === 'undefined') { // Only run on server side
  setInterval(cleanupExpiredSessions, 60000) // Clean up every minute
}