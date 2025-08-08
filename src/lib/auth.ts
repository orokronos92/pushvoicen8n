import { SignJWT, jwtVerify } from 'jose'
import { jwtDecode } from 'jwt-decode'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pushvoice-secret-key-very-long-and-complex-2025'
)
const JWT_EXPIRES_IN = '5m' // 5 minutes en format JWT standard

export interface JWTPayload {
  userId: string
  sessionId: string
  iat?: number
  exp?: number
}

/**
 * Generate a JWT token for authentication (compatible client-side)
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(JWT_SECRET)
    
    return token
  } catch (error) {
    console.error('JWT generation failed:', error)
    throw new Error('Token generation failed')
  }
}

/**
 * Verify a JWT token and return the payload (compatible client-side)
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Ensure the payload has the required fields
    if (payload && typeof payload === 'object' && 'userId' in payload && 'sessionId' in payload) {
      return payload as unknown as JWTPayload
    }
    
    return null
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Check if a token is expired (using jwt-decode for client-side compatibility)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token)
    if (!decoded.exp) return true
    
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
    const decoded = jwtDecode(token)
    if (!decoded.exp) return 0
    
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
export async function refreshToken(oldToken: string): Promise<string | null> {
  try {
    const payload = await verifyToken(oldToken)
    if (!payload) return null
    
    const { iat, exp, ...newPayload } = payload
    return await generateToken(newPayload)
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

/**
 * Simple JWT validation for WebSocket communication
 */
export function validateTokenForWebSocket(token: string): boolean {
  try {
    // Basic structure check
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Check expiration
    return !isTokenExpired(token)
  } catch (error) {
    return false
  }
}

/**
 * Extract payload from token without verification (for UI purposes)
 */
export function getTokenPayload(token: string): JWTPayload | null {
  try {
    return jwtDecode(token)
  } catch (error) {
    return null
  }
}