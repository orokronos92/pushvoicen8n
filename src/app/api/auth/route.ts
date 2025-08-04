import { NextRequest, NextResponse } from 'next/server'
import { generateToken, createSessionPayload } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // In a real application, you would authenticate the user here
    // For now, we'll generate a token with a dummy user ID
    const body = await request.json()
    
    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    // Extract user ID from request or generate a dummy one
    const userId = body.userId || `user_${Date.now()}`
    
    // Create session payload
    const sessionPayload = createSessionPayload(userId)
    
    // Generate JWT token
    const token = generateToken(sessionPayload)
    
    // Return the token and session info
    return NextResponse.json({
      success: true,
      token,
      sessionId: sessionPayload.sessionId,
      userId: sessionPayload.userId,
      expiresIn: '5m', // 5 minutes as specified in PRD
    })
  } catch (error) {
    console.error('Error generating auth token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint accepts POST requests for token generation',
  })
}