import { vi } from 'vitest'

// Mock global objects
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  readyState: number = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    if (this.readyState === MockWebSocket.OPEN) {
      // Parse the sent data and simulate a response
      try {
        const message = JSON.parse(data)
        this.simulateResponse(message)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }))
    }
  }

  simulateResponse(message: any) {
    // Simulate different types of responses based on the message type
    let response: any

    switch (message.type) {
      case 'auth':
        response = {
          type: 'auth',
          payload: { success: true },
          timestamp: new Date().toISOString()
        }
        break
      case 'session_start':
        response = {
          type: 'session_start',
          payload: { success: true, sessionId: message.payload?.sessionId },
          timestamp: new Date().toISOString()
        }
        break
      case 'message':
        response = {
          type: 'message',
          payload: {
            text: `Echo: ${message.payload?.text}`,
            sessionId: message.payload?.sessionId
          },
          timestamp: new Date().toISOString()
        }
        break
      default:
        response = {
          type: 'error',
          payload: { message: 'Unknown message type' },
          timestamp: new Date().toISOString()
        }
    }

    // Simulate server response after a short delay
    setTimeout(() => {
      if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
        this.onmessage(new MessageEvent('message', {
          data: JSON.stringify(response)
        }))
      }
    }, 50)
  }
}

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket as any