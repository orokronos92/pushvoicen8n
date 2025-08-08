'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { createError } from '@/lib/errors/ErrorTypes'
import ErrorDisplay from '@/components/ErrorDisplay'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary professionnel avec intégration Sentry et logging structuré
 * Capture les erreurs React et fournit une UI de fallback élégante
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log structuré de l'erreur
    console.error('Error Boundary caught an error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    })

    // Envoi à Sentry pour le monitoring en production (si disponible)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }

    // Callback personnalisé pour la gestion d'erreur
    this.props.onError?.(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback personnalisé ou composant d'erreur par défaut
      if (this.props.fallback) {
        return this.props.fallback
      }

      const appError = this.state.error
        ? createError('REACT_ERROR', this.state.error.message, {
            originalError: this.state.error,
            componentStack: this.state.errorInfo?.componentStack,
          })
        : createError('UNKNOWN_ERROR', 'Une erreur inattendue est survenue')

      return <ErrorDisplay error={appError} onReset={this.handleReset} />
    }

    return this.props.children
  }
}

export default ErrorBoundary