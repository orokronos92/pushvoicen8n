import { NextRequest, NextResponse } from 'next/server'
import { generateToken, createSessionPayload } from '@/lib/auth'

// Spécifier le runtime Node.js pour éviter les problèmes avec Edge
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Extraire l'ID utilisateur du corps de la requête
    const body = await request.json()
    
    // Validation de base
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Corps de requête invalide' },
        { status: 400 }
      )
    }
    
    // Extraire l'ID utilisateur ou en générer un par défaut
    const userId = body.userId || `user_${Date.now()}`
    
    // Créer le payload de session
    const sessionPayload = createSessionPayload(userId)
    
    // Générer le token JWT côté serveur
    const token = await generateToken(sessionPayload)
    
    // Retourner le token et les informations de session
    return NextResponse.json({
      success: true,
      token,
      sessionId: sessionPayload.sessionId,
      userId: sessionPayload.userId,
      expiresIn: '5m', // 5 minutes comme spécifié
    })
  } catch (error) {
    console.error('Erreur lors de la génération du token de session:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cette endpoint accepte les requêtes POST pour la génération de tokens',
  })
}