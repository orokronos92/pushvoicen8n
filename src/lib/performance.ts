/**
 * Performance optimization utilities for PushVoice
 */

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Measure execution time of a function
   */
  static async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    const duration = end - start
    
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordMetric(name, duration)
    
    return result
  }

  /**
   * Measure execution time of a synchronous function
   */
  static measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    const duration = end - start
    
    const monitor = PerformanceMonitor.getInstance()
    monitor.recordMetric(name, duration)
    
    return result
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
    
    // Keep only last 100 measurements
    const measurements = this.metrics.get(name)!
    if (measurements.length > 100) {
      measurements.shift()
    }
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number | null {
    const measurements = this.metrics.get(name)
    if (!measurements || measurements.length === 0) return null
    
    const sum = measurements.reduce((acc: number, val: number) => acc + val, 0)
    return sum / measurements.length
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {}
    
    for (const [name, measurements] of this.metrics.entries()) {
      if (measurements.length > 0) {
        const sum = measurements.reduce((acc: number, val: number) => acc + val, 0)
        result[name] = {
          average: sum / measurements.length,
          count: measurements.length
        }
      }
    }
    
    return result
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility
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

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = func(...args)
    cache.set(key, result)
    
    return result
  }) as T
}

// Virtual scrolling utility
export interface VirtualScrollItem {
  id: string | number
  height: number
  data: any
}

export class VirtualScrollManager {
  private items: VirtualScrollItem[]
  private containerHeight: number
  private itemHeight: number
  private scrollTop: number = 0
  private buffer: number = 5 // Number of items to render above/below viewport

  constructor(items: VirtualScrollItem[], containerHeight: number, itemHeight: number) {
    this.items = items
    this.containerHeight = containerHeight
    this.itemHeight = itemHeight
  }

  /**
   * Update scroll position
   */
  setScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop
  }

  /**
   * Get visible items
   */
  getVisibleItems(): { startIndex: number; endIndex: number; offsetY: number } {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer)
    const endIndex = Math.min(
      this.items.length - 1,
      Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.buffer
    )
    const offsetY = startIndex * this.itemHeight

    return { startIndex, endIndex, offsetY }
  }

  /**
   * Get total height of all items
   */
  getTotalHeight(): number {
    return this.items.length * this.itemHeight
  }

  /**
   * Update items
   */
  updateItems(items: VirtualScrollItem[]): void {
    this.items = items
  }

  /**
   * Update container height
   */
  updateContainerHeight(height: number): void {
    this.containerHeight = height
  }
}

// WebSocket connection optimization
export class WebSocketOptimizer {
  private connection: WebSocket | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private messageQueue: any[] = []
  private isConnecting: boolean = false
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(
    private url: string,
    private onMessage: (message: any) => void,
    private onConnect: () => void,
    private onDisconnect: (event: CloseEvent) => void,
    private onError: (error: Event) => void
  ) {}

  /**
   * Connect to WebSocket with optimization
   */
  connect(): void {
    if (this.isConnecting || (this.connection && this.connection.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true

    try {
      this.connection = new WebSocket(this.url)
      
      this.connection.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.flushMessageQueue()
        this.onConnect()
      }

      this.connection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.onMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.connection.onclose = (event) => {
        this.isConnecting = false
        this.stopHeartbeat()
        this.onDisconnect(event)
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000) // Exponential backoff, max 30s
            this.connect()
          }, this.reconnectDelay)
        }
      }

      this.connection.onerror = (error) => {
        this.isConnecting = false
        this.onError(error)
      }
    } catch (error) {
      this.isConnecting = false
      console.error('Error creating WebSocket connection:', error)
    }
  }

  /**
   * Send message with queueing
   */
  send(message: any): void {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message)
      
      // Limit queue size to prevent memory issues
      if (this.messageQueue.length > 100) {
        this.messageQueue.shift()
      }
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.connection && this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify(message))
      }
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connection && this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat()
    if (this.connection) {
      this.connection.close(1000, 'Normal closure')
      this.connection = null
    }
    this.messageQueue = []
  }
}

// Image optimization utilities
export class ImageOptimizer {
  /**
   * Generate optimized image URL
   */
  static getOptimizedImageUrl(
    url: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    // This is a placeholder implementation
    // In a real application, you would integrate with your image CDN or service
    const params = new URLSearchParams()
    
    if (width) params.append('w', width.toString())
    if (height) params.append('h', height.toString())
    params.append('q', quality.toString())
    
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${params.toString()}`
  }

  /**
   * Lazy load images with Intersection Observer
   */
  static lazyLoadImages(
    selector: string = 'img[data-src]',
    options?: IntersectionObserverInit
  ): void {
    const images = document.querySelectorAll(selector)
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || ''
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        })
      }, options || { rootMargin: '50px' })
      
      images.forEach(img => imageObserver.observe(img))
    } else {
      // Fallback for browsers that don't support Intersection Observer
      images.forEach(img => {
        const element = img as HTMLImageElement
        element.src = element.dataset.src || ''
      })
    }
  }
}

// Bundle size optimization utilities
export class BundleOptimizer {
  /**
   * Dynamically import modules with error handling
   */
  static async dynamicImport<T>(
    importFn: () => Promise<T>,
    fallback?: () => T,
    retries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn()
      } catch (error) {
        lastError = error as Error
        console.warn(`Dynamic import failed (attempt ${i + 1}/${retries}):`, error)
        
        if (i < retries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
      }
    }
    
    if (fallback) {
      return fallback()
    }
    
    throw lastError || new Error('Dynamic import failed')
  }

  /**
   * Preload critical resources
   */
  static preloadResources(urls: string[]): void {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = url.endsWith('.js') ? 'script' : 'style'
      link.href = url
      document.head.appendChild(link)
    })
  }
}