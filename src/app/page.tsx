'use client'

import { useState, useEffect, useRef } from 'react'
import VoiceRecorder from '@/components/VoiceRecorder'
import ConversationDisplay from '@/components/ConversationDisplay'
import SessionManager from '@/components/SessionManager'
import ErrorDisplay from '@/components/ErrorDisplay'
import { createError, getUserFriendlyErrorMessage, checkBrowserSupport } from '@/lib/utils'
import { createWebSocketClient, WebSocketMessage } from '@/lib/websocket'
import { useSession } from '@/hooks/useSession'
import { useSessionInactivity } from '@/hooks/useInactivityTimer'

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'n8n', timestamp: Date}>>([])
  const [error, setError] = useState<any>(null)
  const [browserSupported, setBrowserSupported] = useState(true)
  const [wsConnected, setWsConnected] = useState(false)
  
  const wsClientRef = useRef<any>(null)
  const { session, startSession, endSession, validateAndUpdateSession, updateActivity, updateTimeRemaining } = useSession()
  const { resetTimer, getTimeRemaining } = useSessionInactivity(() => {
    // End session when inactive for 5 minutes
    if (session.isActive) {
      endSession()
      setError(createError('SESSION_TIMEOUT', 'Session terminée pour inactivité'))
    }
  })

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording)
  }

  const handleNewMessage = (message: {text: string, sender: 'user' | 'n8n'}) => {
    setMessages(prev => [...prev, {...message, timestamp: new Date()}])
  }
  
  const handleSendMessage = async (text: string) => {
    if (!session.isActive || !session.token || !wsClientRef.current) {
      setError(createError('SESSION_ERROR', 'No active session'))
      return
    }
    
    // Validate session before sending message
    const isValid = await validateAndUpdateSession()
    if (!isValid) {
      setError(createError('SESSION_ERROR', 'Session invalide'))
      return
    }
    
    // Reset inactivity timer when user sends a message
    resetTimer()
    
    // Update session activity
    updateActivity()
    
    // Add message to conversation display
    setMessages(prev => [...prev, {
      text,
      sender: 'user',
      timestamp: new Date()
    }])
    
    // Send message via WebSocket
    try {
      wsClientRef.current.sendTextMessage(text, session.token)
    } catch (error) {
      setError(createError('SEND_ERROR', 'Failed to send message'))
    }
  }

  const handleSessionStateChange = async (active: boolean) => {
    if (active) {
      const success = await startSession()
      if (!success) {
        setError(createError('SESSION_ERROR', 'Failed to start session'))
        return
      }
      
      // Reset inactivity timer when starting a new session
      resetTimer()
      
      // Connect to WebSocket if not already connected
      if (!wsConnected && wsClientRef.current) {
        wsClientRef.current.connect(session.token || undefined)
      } else if (wsClientRef.current && session.token && session.sessionId) {
        // Update token and start session
        wsClientRef.current.updateToken(session.token)
        wsClientRef.current.startSession(session.sessionId)
      }
    } else {
      // End session and disconnect from WebSocket
      if (wsClientRef.current) {
        wsClientRef.current.endSession()
      }
      endSession()
    }
  }

  // Initialize WebSocket client on component mount
  useEffect(() => {
    const { supported, errors } = checkBrowserSupport()
    setBrowserSupported(supported)
    
    if (!supported && errors.length > 0) {
      setError(errors[0])
      return
    }
    
    // Initialize WebSocket client
    const wsUrl = 'wss://botvoice.srv801583.hstgr.cloud/ws'
    
    wsClientRef.current = createWebSocketClient({
      url: wsUrl,
      onMessage: handleWebSocketMessage,
      onConnect: handleWebSocketConnect,
      onDisconnect: handleWebSocketDisconnect,
      onError: handleWebSocketError,
      onSessionExpiry: handleSessionExpiry,
      autoReconnect: true,
      reconnectInterval: 5000,
    })
    
    return () => {
      // Cleanup WebSocket connection on unmount
      if (wsClientRef.current) {
        wsClientRef.current.disconnect()
      }
    }
  }, [])

  const handleErrorDismiss = () => {
    setError(null)
  }
  
  // WebSocket message handler
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    // Reset inactivity timer when receiving a message
    resetTimer()
    
    // Update session activity when receiving a message
    updateActivity()
    
    switch (message.type) {
      case 'message':
        // Handle incoming message from n8n
        if (message.payload && message.payload.text) {
          setMessages(prev => [...prev, {
            text: message.payload.text,
            sender: 'n8n',
            timestamp: new Date()
          }])
        }
        break
        
      case 'auth':
        // Handle authentication response
        if (message.payload && message.payload.success === false) {
          setError(createError('AUTH_ERROR', 'Authentication failed'))
        }
        break
        
      case 'session_start':
        // Handle session start response
        if (message.payload && message.payload.success === false) {
          setError(createError('SESSION_ERROR', 'Failed to start session'))
        }
        break
        
      default:
        console.log('Received WebSocket message:', message)
    }
  }
  
  // WebSocket connection handlers
  const handleWebSocketConnect = () => {
    setWsConnected(true)
    console.log('WebSocket connected')
    
    // If we have an active session, authenticate and start session
    if (session.token && session.sessionId && session.isActive) {
      if (wsClientRef.current) {
        wsClientRef.current.updateToken(session.token)
        wsClientRef.current.startSession(session.sessionId)
      }
    }
  }
  
  const handleWebSocketDisconnect = (event: CloseEvent) => {
    setWsConnected(false)
    console.log('WebSocket disconnected:', event.code, event.reason)
    
    // Show error message for unexpected disconnections
    if (session.isActive && event.code !== 1000) {
      setError(createError('WEBSOCKET_ERROR', 'Connection lost. Attempting to reconnect...'))
    }
  }
  
  const handleWebSocketError = (error: Event) => {
    console.error('WebSocket error:', error)
    setError(createError('WEBSOCKET_ERROR', 'WebSocket connection error'))
  }
  
  const handleSessionExpiry = () => {
    setError(createError('SESSION_EXPIRED', 'Session expired. Please start a new session.'))
    endSession()
  }

  if (!browserSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Navigateur non supporté</h2>
            <p className="mt-2 text-gray-600">
              {error ? getUserFriendlyErrorMessage(error) : "Votre navigateur ne supporte pas les fonctionnalités requises pour cette application."}
            </p>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Cette application nécessite un navigateur moderne supportant:
              </p>
              <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                <li>WebSocket</li>
                <li>Reconnaissance vocale</li>
                <li>Accès au microphone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">BotVoice</h1>
        <p className="text-base sm:text-lg text-gray-600">Communication vocale avec votre agent n8n</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 order-2 xl:order-1">
          <ConversationDisplay messages={messages} suppressHydrationWarning={true} />
        </div>
        
        <div className="space-y-4 sm:space-y-6 order-1 xl:order-2">
          <SessionManager
            onSessionStateChange={handleSessionStateChange}
            sessionActive={session.isActive}
            timeRemaining={Math.min(session.timeRemaining, Math.floor(getTimeRemaining() / 1000))}
            onTimeRemainingChange={updateTimeRemaining}
          />
          
          <VoiceRecorder
            onRecordingStateChange={handleRecordingStateChange}
            onNewMessage={handleNewMessage}
            sessionActive={session.isActive}
            isRecording={isRecording}
            onError={setError}
            onSendMessage={handleSendMessage}
            suppressHydrationWarning={true}
          />
        </div>
      </div>

      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
        <p>Parlez naturellement, votre message sera envoyé automatiquement après 2 secondes de silence.</p>
      </div>
      
      {/* Connection status indicator */}
      <div className="fixed bottom-2 left-2 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs text-gray-600">
          {wsConnected ? 'Connecté' : 'Déconnecté'}
        </span>
      </div>
      
      {/* Error Display */}
      <ErrorDisplay
        error={error}
        onDismiss={handleErrorDismiss}
      />
    </div>
  )
}