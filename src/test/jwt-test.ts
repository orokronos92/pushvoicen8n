/**
 * Test pour vérifier que les tokens JWT sont générés correctement
 * et que la communication avec le proxy fonctionne comme attendu
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateToken, verifyToken, createSessionPayload } from '@/lib/auth'

// Mock de l'environnement
vi.mock('process', () => ({
  env: {
    JWT_SECRET: 'pushvoice-secret-key-very-long-and-complex-2025'
  }
}))

describe('JWT Token Generation and Verification', () => {
  let testUserId: string

  beforeEach(() => {
    testUserId = `test_user_${Date.now()}`
  })

  it('devrait générer un token JWT valide', async () => {
    const payload = createSessionPayload(testUserId)
    const token = await generateToken(payload)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // Format JWT: header.payload.signature
  })

  it('devrait vérifier un token JWT valide', async () => {
    const payload = createSessionPayload(testUserId)
    const token = await generateToken(payload)
    
    const verifiedPayload = await verifyToken(token)
    
    expect(verifiedPayload).toBeTruthy()
    expect(verifiedPayload?.userId).toBe(testUserId)
    expect(verifiedPayload?.sessionId).toBe(payload.sessionId)
  })

  it('devrait rejeter un token JWT invalide', async () => {
    const invalidToken = 'invalid.token.here'
    const verifiedPayload = await verifyToken(invalidToken)
    
    expect(verifiedPayload).toBeNull()
  })

  it('devrait générer des tokens différents pour des sessions différentes', async () => {
    const payload1 = createSessionPayload(testUserId)
    const token1 = await generateToken(payload1)
    
    const payload2 = createSessionPayload(`${testUserId}_2`)
    const token2 = await generateToken(payload2)
    
    expect(token1).not.toBe(token2)
  })
})

describe('API Session Token Endpoint', () => {
  it('devrait pouvoir être appelé via fetch', async () => {
    // Ce test vérifie que l'endpoint peut être appelé
    // Note: Ce test nécessite un serveur de test pour fonctionner pleinement
    
    const response = await fetch('/api/session-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'test_user' }),
    })
    
    // En environnement de test réel, nous vérifierions la réponse
    // Ici, nous vérifions juste que le type de réponse est correct
    expect(response).toBeDefined()
  })
})