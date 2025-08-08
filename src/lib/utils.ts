/**
 * Utility functions for error handling and user feedback
 */

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

/**
 * Create a standardized application error
 */
export function createError(code: string, message: string, details?: any): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
  }
}

/**
 * Common error types
 */
export const ErrorTypes = {
  MICROPHONE_ACCESS_DENIED: 'MICROPHONE_ACCESS_DENIED',
  MICROPHONE_NOT_AVAILABLE: 'MICROPHONE_NOT_AVAILABLE',
  SPEECH_RECOGNITION_ERROR: 'SPEECH_RECOGNITION_ERROR',
  WEBSOCKET_CONNECTION_ERROR: 'WEBSOCKET_CONNECTION_ERROR',
  WEBSOCKET_AUTH_ERROR: 'WEBSOCKET_AUTH_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: AppError): string {
  switch (error.code) {
    case ErrorTypes.MICROPHONE_ACCESS_DENIED:
      return "L'accès au microphone a été refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur."
    
    case ErrorTypes.MICROPHONE_NOT_AVAILABLE:
      return 'Aucun microphone n\'a été détecté. Veuillez brancher un microphone et réessayer.'
    
    case ErrorTypes.SPEECH_RECOGNITION_ERROR:
      return 'Une erreur est survenue lors de la reconnaissance vocale. Veuillez réessayer.'
    
    case ErrorTypes.WEBSOCKET_CONNECTION_ERROR:
      return 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet.'
    
    case ErrorTypes.WEBSOCKET_AUTH_ERROR:
      return 'Erreur d\'authentification. Veuillez redémarrer la session.'
    
    case ErrorTypes.SESSION_EXPIRED:
      return 'La session a expiré. Veuillez redémarrer une nouvelle session.'
    
    case ErrorTypes.NETWORK_ERROR:
      return 'Erreur réseau. Veuillez vérifier votre connexion Internet.'
    
    case ErrorTypes.UNKNOWN_ERROR:
    default:
      return 'Une erreur inattendue est survenue. Veuillez réessayer.'
  }
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: AppError): string {
  return `[${error.timestamp.toISOString()}] ${error.code}: ${error.message}${
    error.details ? ` - ${JSON.stringify(error.details)}` : ''
  }`
}

/**
 * Check if browser supports required features
 */
export function checkBrowserSupport(): {
  supported: boolean
  errors: AppError[]
} {
  const errors: AppError[] = []
  
  // Check for WebSocket support
  if (typeof WebSocket === 'undefined') {
    errors.push(createError(
      ErrorTypes.WEBSOCKET_CONNECTION_ERROR,
      'WebSocket n\'est pas supporté par ce navigateur'
    ))
  }
  
  // Check for SpeechRecognition support
  const SpeechRecognition = (window as any).SpeechRecognition || 
                          (window as any).webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    errors.push(createError(
      ErrorTypes.SPEECH_RECOGNITION_ERROR,
      'La reconnaissance vocale n\'est pas supportée par ce navigateur'
    ))
  }
  
  // Check for MediaDevices (microphone access)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    errors.push(createError(
      ErrorTypes.MICROPHONE_NOT_AVAILABLE,
      'L\'accès au microphone n\'est pas supporté par ce navigateur'
    ))
  }
  
  return {
    supported: errors.length === 0,
    errors,
  }
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: (key: string): any => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },
  
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error writing to localStorage:', error)
      return false
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  },
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes} min ${remainingSeconds} sec`
  }
  
  return `${remainingSeconds} sec`
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}