import { verifyToken, refreshToken, getTokenTimeRemaining } from './auth'
import { PerformanceMonitor, debounce, throttle } from './performance'

export interface WebSocketMessage {
  type: 'message' | 'auth' | 'ping' | 'pong' | 'session_start' | 'session_end' | 'session_heartbeat'
  payload: any
  timestamp: Date
}

export interface WebSocketOptions {
  url: string
  onMessage: (message: WebSocketMessage) => void
  onConnect: () => void
  onDisconnect: (event: CloseEvent) => void
  onError: (error: Event) => void
  onSessionExpiry?: () => void
  token?: string
  sessionId?: string
  autoReconnect?: boolean
  reconnectInterval?: number
  heartbeatInterval?: number
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private options: WebSocketOptions
  private reconnectTimer: NodeJS.Timeout | null = null
  private isConnected = false
  private messageQueue: WebSocketMessage[] = []
  private pingTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private sessionExpiryTimer: NodeJS.Timeout | null = null
  private currentToken: string | null = null
  private currentSessionId: string | null = null
  private performanceMonitor: PerformanceMonitor

  constructor(options: WebSocketOptions) {
    this.options = {
      autoReconnect: true,
      reconnectInterval: 5000,
      heartbeatInterval: 30000, // 30 seconds
      ...options,
    }
    
    this.currentToken = options.token || null
    this.currentSessionId = options.sessionId || null
    this.performanceMonitor = PerformanceMonitor.getInstance()
  }

  /**
   * Connect to the WebSocket server
   */
  connect(token?: string): void {
    if (this.isConnected) return

    try {
      const wsUrl = this.options.url
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.isConnected = true
        this.options.onConnect()
        
        // Authenticate if token is provided
        const authToken = token || this.currentToken || this.options.token
        if (authToken) {
          this.authenticate(authToken)
        }
        
        // Start session if sessionId is provided
        const sessionId = this.currentSessionId || this.options.sessionId
        if (sessionId) {
          this.startSession(sessionId)
        }
        
        // Send any queued messages
        this.flushMessageQueue()
        
        // Start ping/pong for connection health
        this.startPingPong()
        
        // Start session heartbeat
        this.startSessionHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          // Measure message processing time
          PerformanceMonitor.measureSync('websocket-message-processing', () => {
            this.options.onMessage(message)
          })
          
          // Handle different message types
          switch (message.type) {
            case 'pong':
              this.handlePong()
              break
            case 'session_heartbeat':
              this.handleSessionHeartbeat()
              break
            case 'session_end':
              this.handleSessionEnd(message.payload)
              break
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        this.isConnected = false
        this.stopPingPong()
        this.stopSessionHeartbeat()
        this.stopSessionExpiryTimer()
        this.options.onDisconnect(event)
        
        // Auto-reconnect if enabled
        if (this.options.autoReconnect) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        this.options.onError(error)
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
      this.options.onError(error as Event)
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopPingPong()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.isConnected = false
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date(),
    }

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(fullMessage))
    } else {
      // Queue message if not connected
      this.messageQueue.push(fullMessage)
    }
  }

  /**
   * Send a text message to n8n
   */
  sendTextMessage = debounce((text: string, token?: string) => {
    const authToken = token || this.currentToken
    if (!authToken) {
      console.error('No token available for sending message')
      return
    }
    
    // Envoyer le token nu sans préfixe "Bearer" pour la compatibilité avec le proxy
    this.send({
      type: 'message',
      payload: {
        text,
        token: authToken,
        sessionId: this.currentSessionId,
      },
    })
  }, 100) // Debounce messages within 100ms
  
  /**
   * Start a new session
   */
  startSession(sessionId: string): void {
    this.currentSessionId = sessionId
    this.send({
      type: 'session_start',
      payload: {
        sessionId,
        token: this.currentToken,
      },
    })
  }
  
  /**
   * End the current session
   */
  endSession(): void {
    if (this.currentSessionId) {
      this.send({
        type: 'session_end',
        payload: {
          sessionId: this.currentSessionId,
        },
      })
      this.currentSessionId = null
      this.stopSessionHeartbeat()
      this.stopSessionExpiryTimer()
    }
  }
  
  /**
   * Update the authentication token
   */
  updateToken(token: string): void {
    this.currentToken = token
    if (this.isConnected) {
      this.authenticate(token)
    }
  }

  /**
   * Authenticate with the server
   */
  private authenticate(token: string): void {
    // Verify token before sending
    const isValid = verifyToken(token)
    if (!isValid) {
      console.error('Invalid token for authentication')
      return
    }

    this.currentToken = token
    // Envoyer le token nu sans préfixe "Bearer" pour la compatibilité avec le proxy
    this.send({
      type: 'auth',
      payload: {
        token,
      },
    })
    
    // Set up token expiry check
    this.setupTokenExpiryCheck(token)
  }
  
  /**
   * Set up token expiry check
   */
  private setupTokenExpiryCheck(token: string): void {
    this.stopSessionExpiryTimer()
    
    const timeRemaining = getTokenTimeRemaining(token)
    if (timeRemaining > 0) {
      // Refresh token 1 minute before expiry
      const refreshTime = Math.max(0, timeRemaining - 60) * 1000
      
      this.sessionExpiryTimer = setTimeout(() => {
        if (this.options.onSessionExpiry) {
          this.options.onSessionExpiry()
        }
      }, refreshTime)
    }
  }

  /**
   * Start ping/pong mechanism for connection health
   */
  private startPingPong(): void {
    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          payload: {},
        })
      }
    }, this.options.heartbeatInterval || 30000) // Send ping every 30 seconds by default
  }
  
  /**
   * Start session heartbeat
   */
  private startSessionHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.currentSessionId) {
        this.send({
          type: 'session_heartbeat',
          payload: {
            sessionId: this.currentSessionId,
          },
        })
      }
    }, 60000) // Send heartbeat every minute
  }
  
  /**
   * Stop session heartbeat
   */
  private stopSessionHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
  
  /**
   * Stop session expiry timer
   */
  private stopSessionExpiryTimer(): void {
    if (this.sessionExpiryTimer) {
      clearTimeout(this.sessionExpiryTimer)
      this.sessionExpiryTimer = null
    }
  }

  /**
   * Stop ping/pong mechanism
   */
  private stopPingPong(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
  
  /**
   * Handle session heartbeat response
   */
  private handleSessionHeartbeat(): void {
    // Session is still active, could implement additional logic here
  }
  
  /**
   * Handle session end from server
   */
  private handleSessionEnd(payload: any): void {
    if (payload.sessionId === this.currentSessionId) {
      this.currentSessionId = null
      this.stopSessionHeartbeat()
      this.stopSessionExpiryTimer()
      
      if (this.options.onSessionExpiry) {
        this.options.onSessionExpiry()
      }
    }
  }

  /**
   * Handle pong response
   */
  private handlePong(): void {
    // Connection is healthy, could implement additional logic here
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.options.reconnectInterval)
  }

  /**
   * Flush the message queue
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }

  /**
   * Check if the WebSocket is connected
   */
  get connected(): boolean {
    return this.isConnected
  }
}

/**
 * Create a WebSocket client instance
 */
export function createWebSocketClient(options: WebSocketOptions): WebSocketClient {
  return new WebSocketClient(options)
}