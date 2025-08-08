/**
 * Types d'erreurs standardisés pour l'application
 * Permet une gestion cohérente et un logging structuré
 */

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'WEBSOCKET_ERROR'
  | 'AUTH_ERROR'
  | 'SESSION_ERROR'
  | 'SESSION_EXPIRED'
  | 'SPEECH_RECOGNITION_ERROR'
  | 'SEND_ERROR'
  | 'REACT_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'UNKNOWN_ERROR'

export interface AppError {
  code: ErrorType
  message: string
  details?: any
  timestamp: Date
  stack?: string
  userMessage?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  retryable: boolean
}

/**
 * Crée une erreur structurée avec métadonnées complètes
 */
export function createError(
  code: ErrorType,
  message: string,
  details?: any,
  userMessage?: string
): AppError {
  const severityMap: Record<ErrorType, AppError['severity']> = {
    NETWORK_ERROR: 'medium',
    WEBSOCKET_ERROR: 'medium',
    AUTH_ERROR: 'high',
    SESSION_ERROR: 'high',
    SESSION_EXPIRED: 'medium',
    SPEECH_RECOGNITION_ERROR: 'low',
    SEND_ERROR: 'medium',
    REACT_ERROR: 'high',
    VALIDATION_ERROR: 'low',
    PERMISSION_ERROR: 'high',
    UNKNOWN_ERROR: 'medium',
  }

  const retryableMap: Record<ErrorType, boolean> = {
    NETWORK_ERROR: true,
    WEBSOCKET_ERROR: true,
    AUTH_ERROR: false,
    SESSION_ERROR: false,
    SESSION_EXPIRED: false,
    SPEECH_RECOGNITION_ERROR: true,
    SEND_ERROR: true,
    REACT_ERROR: false,
    VALIDATION_ERROR: false,
    PERMISSION_ERROR: false,
    UNKNOWN_ERROR: false,
  }

  const userMessages: Record<ErrorType, string> = {
    NETWORK_ERROR: 'Problème de connexion réseau. Vérifiez votre internet.',
    WEBSOCKET_ERROR: 'Problème de communication avec le serveur.',
    AUTH_ERROR: 'Erreur d\'authentification. Veuillez vous reconnecter.',
    SESSION_ERROR: 'Erreur de session. Veuillez redémarrer une session.',
    SESSION_EXPIRED: 'Votre session a expiré. Veuillez en démarrer une nouvelle.',
    SPEECH_RECOGNITION_ERROR: 'La reconnaissance vocale n\'est pas disponible.',
    SEND_ERROR: 'Erreur lors de l\'envoi du message. Veuillez réessayer.',
    REACT_ERROR: 'Une erreur technique est survenue.',
    VALIDATION_ERROR: 'Données invalides. Veuillez vérifier votre saisie.',
    PERMISSION_ERROR: 'Vous n\'avez pas les permissions nécessaires.',
    UNKNOWN_ERROR: 'Une erreur inattendue est survenue.',
  }

  return {
    code,
    message,
    details,
    timestamp: new Date(),
    userMessage: userMessage || userMessages[code],
    severity: severityMap[code],
    retryable: retryableMap[code],
  }
}

/**
 * Vérifie si une erreur est de type réseau
 */
export function isNetworkError(error: AppError): boolean {
  return error.code === 'NETWORK_ERROR' || error.code === 'WEBSOCKET_ERROR'
}

/**
 * Vérifie si une erreur est critique (nécessite une intervention utilisateur)
 */
export function isCriticalError(error: AppError): boolean {
  return error.severity === 'high' || error.severity === 'critical'
}

/**
 * Vérifie si une erreur peut être retryée automatiquement
 */
export function isRetryableError(error: AppError): boolean {
  return error.retryable
}

/**
 * Formate une erreur pour le logging
 */
export function formatErrorForLogging(error: AppError): string {
  return JSON.stringify({
    code: error.code,
    message: error.message,
    timestamp: error.timestamp.toISOString(),
    severity: error.severity,
    retryable: error.retryable,
    details: error.details,
  }, null, 2)
}

/**
 * Convertit une erreur JavaScript standard en AppError
 */
export function fromNativeError(error: Error, code: ErrorType = 'UNKNOWN_ERROR'): AppError {
  return createError(
    code,
    error.message,
    {
      stack: error.stack,
      name: error.name,
    },
    undefined
  )
}