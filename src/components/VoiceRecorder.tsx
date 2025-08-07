'use client'

import { useState, useEffect, useRef } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

interface VoiceRecorderProps {
  onRecordingStateChange: (isRecording: boolean) => void
  onNewMessage: (message: { text: string; sender: 'user' | 'n8n' }) => void
  onSendMessage: (text: string) => void
  sessionActive: boolean
  isRecording: boolean
  onError: (error: any) => void
  suppressHydrationWarning?: boolean
}

export default function VoiceRecorder({
  onRecordingStateChange,
  onNewMessage,
  onSendMessage,
  sessionActive,
  isRecording,
  onError,
  suppressHydrationWarning,
}: VoiceRecorderProps) {
  const [transcript, setTranscript] = useState('')
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSpokenTime, setLastSpokenTime] = useState<number>(0)
  const [isClient, setIsClient] = useState(false)
  
  const {
    transcript: speechTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set isClient to true when component mounts on client
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (speechTranscript !== transcript) {
      setTranscript(speechTranscript)
      setLastSpokenTime(Date.now())
      
      // Clear any existing silence timer
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      
      // Set a new silence timer (2 seconds)
      silenceTimeoutRef.current = setTimeout(() => {
        handleSendMessage()
      }, 2000)
    }
  }, [speechTranscript, transcript])

  useEffect(() => {
    onRecordingStateChange(listening)
    
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }, [listening, onRecordingStateChange])

  const handleStartRecording = () => {
    if (!sessionActive) return
    
    resetTranscript()
    setTranscript('')
    
    try {
      SpeechRecognition.startListening({ continuous: true, language: 'fr-FR' })
    } catch (error) {
      onError({
        code: 'SPEECH_RECOGNITION_ERROR',
        message: 'Failed to start speech recognition',
        details: error,
        timestamp: new Date(),
      })
    }
  }

  const handleStopRecording = () => {
    SpeechRecognition.stopListening()
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
    }
  }

  const handleSendMessage = async () => {
    if (!transcript.trim() || !sessionActive) return
    
    // Stop recording
    SpeechRecognition.stopListening()
    
    // Send message via WebSocket
    onSendMessage(transcript)
    
    // Reset transcript
    resetTranscript()
    setTranscript('')
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }

  // Only check browser support on client side
  if (isClient && !browserSupportsSpeechRecognition) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">
          Votre navigateur ne supporte pas la reconnaissance vocale.
        </p>
      </div>
    )
  }
  
  // Show loading state during server-side rendering
  if (!isClient) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6" suppressHydrationWarning={suppressHydrationWarning}>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Enregistrement Vocal</h2>
        <div className="flex justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-400"></div>
          </div>
        </div>
        <div className="text-center mt-3">
          <p className="text-sm font-medium text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6" suppressHydrationWarning={suppressHydrationWarning}>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Enregistrement Vocal</h2>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Recording indicator */}
        <div className="flex justify-center">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              listening
                ? 'bg-red-500 recording-indicator'
                : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
            }`}
            onClick={listening ? handleStopRecording : handleStartRecording}
          >
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                listening ? 'bg-white' : 'bg-gray-500'
              }`}
            />
          </div>
        </div>
        
        {/* Status text */}
        <div className="text-center">
          <p className={`text-sm font-medium ${
            listening ? 'text-red-600' : 'text-gray-600'
          }`}>
            {listening ? 'Enregistrement en cours...' : 'Appuyez pour parler'}
          </p>
        </div>
        
        {/* Transcript display */}
        {transcript && (
          <div className="bg-gray-50 rounded-lg p-3 min-h-[60px]">
            <p className="text-gray-700 text-sm">{transcript}</p>
          </div>
        )}
        
        {/* Manual send button (for fallback) */}
        {transcript && (
          <div className="flex justify-center">
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Envoyer
            </button>
          </div>
        )}
        
        {/* Session status */}
        {!sessionActive && (
          <div className="text-center">
            <p className="text-yellow-600 text-sm">
              Veuillez démarrer une session pour enregistrer
            </p>
          </div>
        )}
      </div>
    </div>
  )
}