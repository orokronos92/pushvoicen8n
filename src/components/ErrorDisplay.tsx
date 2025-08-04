'use client'

import { useState, useEffect } from 'react'
import { AppError, getUserFriendlyErrorMessage } from '@/lib/utils'

interface ErrorDisplayProps {
  error: AppError | null
  onDismiss?: () => void
  autoDismiss?: boolean
  dismissTimeout?: number
}

export default function ErrorDisplay({
  error,
  onDismiss,
  autoDismiss = true,
  dismissTimeout = 5000,
}: ErrorDisplayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setVisible(true)
      
      if (autoDismiss) {
        const timer = setTimeout(() => {
          setVisible(false)
          if (onDismiss) {
            onDismiss()
          }
        }, dismissTimeout)
        
        return () => clearTimeout(timer)
      }
    } else {
      setVisible(false)
    }
  }, [error, autoDismiss, dismissTimeout, onDismiss])

  if (!visible || !error) {
    return null
  }

  const getErrorIcon = () => {
    switch (error.code) {
      case 'MICROPHONE_ACCESS_DENIED':
      case 'MICROPHONE_NOT_AVAILABLE':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )
      
      case 'SPEECH_RECOGNITION_ERROR':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )
      
      case 'WEBSOCKET_CONNECTION_ERROR':
      case 'NETWORK_ERROR':
        return (
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        )
      
      case 'SESSION_EXPIRED':
      case 'WEBSOCKET_AUTH_ERROR':
        return (
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      
      default:
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getErrorColor = () => {
    switch (error.code) {
      case 'MICROPHONE_ACCESS_DENIED':
      case 'MICROPHONE_NOT_AVAILABLE':
        return 'bg-red-50 border-red-200 text-red-800'
      
      case 'SPEECH_RECOGNITION_ERROR':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      
      case 'WEBSOCKET_CONNECTION_ERROR':
      case 'NETWORK_ERROR':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      
      case 'SESSION_EXPIRED':
      case 'WEBSOCKET_AUTH_ERROR':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      
      default:
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  return (
    <div className={`fixed bottom-2 sm:bottom-4 right-2 sm:right-4 max-w-[calc(100vw-1rem)] sm:max-w-md p-3 sm:p-4 rounded-lg border ${getErrorColor()} shadow-lg z-50 transition-all duration-300 transform ${
      visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium">
            {getUserFriendlyErrorMessage(error)}
          </p>
          {error.details && process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer">Détails techniques</summary>
              <pre className="text-xs mt-1 p-2 bg-black bg-opacity-10 rounded overflow-x-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <div className="ml-2 sm:ml-4 flex-shrink-0">
          <button
            onClick={() => {
              setVisible(false)
              if (onDismiss) {
                onDismiss()
              }
            }}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}