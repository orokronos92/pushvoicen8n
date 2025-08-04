'use client'

import { useState, useEffect } from 'react'

interface SessionManagerProps {
  onSessionStateChange: (active: boolean) => void
  sessionActive: boolean
  timeRemaining: number
  onTimeRemainingChange: (time: number) => void
}

export default function SessionManager({
  onSessionStateChange,
  sessionActive,
  timeRemaining,
  onTimeRemainingChange,
}: SessionManagerProps) {
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(timeRemaining) // 5 minutes in seconds
  
  useEffect(() => {
    setSessionTimeLeft(timeRemaining)
  }, [timeRemaining])
  
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (sessionActive) {
      timer = setInterval(() => {
        setSessionTimeLeft(prev => {
          const newTime = prev - 1
          onTimeRemainingChange(newTime)
          
          if (newTime <= 1) {
            // Session timeout
            if (timer) clearInterval(timer)
            handleEndSession()
            return 0
          }
          return newTime
        })
      }, 1000)
    } else {
      // Reset session state when inactive
      if (timer) clearInterval(timer)
      setSessionTimeLeft(300)
    }
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [sessionActive, onTimeRemainingChange])
  
  const handleStartSession = () => {
    onSessionStateChange(true)
  }
  
  const handleEndSession = () => {
    onSessionStateChange(false)
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const getSessionStatusColor = () => {
    if (!sessionActive) return 'text-gray-600'
    if (sessionTimeLeft > 120) return 'text-green-600' // More than 2 minutes
    if (sessionTimeLeft > 60) return 'text-yellow-600' // Between 1 and 2 minutes
    return 'text-red-600' // Less than 1 minute
  }
  
  const getSessionStatusText = () => {
    if (!sessionActive) return 'Session inactive'
    if (sessionTimeLeft > 120) return 'Session active'
    if (sessionTimeLeft > 60) return 'Session expirant bientôt'
    return 'Session expirant très bientôt'
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Gestion de Session</h2>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Session status */}
        <div className="text-center">
          <div className={`text-base sm:text-lg font-medium ${getSessionStatusColor()}`}>
            {getSessionStatusText()}
          </div>
          {sessionActive && (
            <div className="text-xl sm:text-2xl font-mono font-bold text-gray-800 mt-1">
              {formatTime(sessionTimeLeft)}
            </div>
          )}
        </div>
        
        {/* Session progress bar */}
        {sessionActive && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                sessionTimeLeft > 120
                  ? 'bg-green-500'
                  : sessionTimeLeft > 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${(sessionTimeLeft / 300) * 100}%` }}
            />
          </div>
        )}
        
        {/* Session controls */}
        <div className="flex justify-center">
          {sessionActive ? (
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium"
            >
              Terminer la Session
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium"
            >
              Démarrer la Session
            </button>
          )}
        </div>
        
        {/* Session info */}
        <div className="text-xs text-gray-500 text-center">
          <p>
            {sessionActive
              ? 'La session se terminera automatiquement après 5 minutes d\'inactivité.'
              : 'Démarrez une session pour commencer à enregistrer des messages.'}
          </p>
        </div>
      </div>
    </div>
  )
}