'use client'

import { useState, useRef, useEffect } from 'react'
import { AudioPayload } from '@/lib/websocket'

interface AudioPlayerProps {
  audioPayload: AudioPayload
  autoPlay?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export default function AudioPlayer({ 
  audioPayload, 
  autoPlay = false, 
  onPlay,
  onPause,
  onEnded 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Format audio data for playback
  const getAudioSource = () => {
    if (!audioPayload.audioData) return null
    
    // Create data URL from base64 audio data
    const format = audioPayload.audioFormat || 'mp3'
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 
                    format === 'wav' ? 'audio/wav' : 
                    'audio/ogg'
    
    return `data:${mimeType};base64,${audioPayload.audioData}`
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      onPause?.()
    } else {
      setIsLoading(true)
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err)
        setError('Impossible de jouer l\'audio')
        setIsLoading(false)
      })
      onPlay?.()
    }
  }

  const handleLoadedData = () => {
    setIsLoading(false)
    if (autoPlay) {
      audioRef.current?.play().catch(err => {
        console.error('Error auto-playing audio:', err)
        setError('Impossible de jouer l\'audio automatiquement')
      })
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
    setIsLoading(false)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    onEnded?.()
  }

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error:', e)
    setError('Erreur lors du chargement de l\'audio')
    setIsLoading(false)
    setIsPlaying(false)
  }

  // Format duration for display
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={getAudioSource() || undefined}
        onLoadedData={handleLoadedData}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />
      
      {/* Audio controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlayback}
          disabled={isLoading || !!error}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center text-white transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-700 truncate">
            Réponse audio
          </div>
          {audioPayload.duration && (
            <div className="text-xs text-gray-500">
              Durée: {formatDuration(audioPayload.duration)}
            </div>
          )}
        </div>
        
        {audioPayload.audioFormat && (
          <div className="text-xs text-gray-500 uppercase">
            {audioPayload.audioFormat}
          </div>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          {error}
        </div>
      )}
      
      {/* Optional transcript */}
      {audioPayload.text && (
        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Transcription:</div>
          <div className="text-sm text-gray-700">
            {audioPayload.text}
          </div>
        </div>
      )}
    </div>
  )
}