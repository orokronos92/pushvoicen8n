// Polyfills pour la compatibilité navigateur

// Importer regenerator-runtime pour async/await
import 'regenerator-runtime/runtime'

// Polyfills pour les API modernes
if (typeof window !== 'undefined') {
  // Polyfill pour fetch API
  if (!window.fetch) {
    // Note: Dans un environnement de production, vous pourriez vouloir utiliser
    // un polyfill complet comme 'whatwg-fetch' ou 'unfetch'
    console.warn('Fetch API non supportée, certains fonctionnalités pourraient ne pas fonctionner correctement')
  }

  // Polyfill pour Object.assign
  if (typeof Object.assign !== 'function') {
    Object.defineProperty(Object, 'assign', {
      value: function assign(target: any) {
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object')
        }
        
        const to = Object(target)
        
        for (let index = 1; index < arguments.length; index++) {
          const nextSource = arguments[index]
          
          if (nextSource != null) {
            for (const nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey]
              }
            }
          }
        }
        
        return to
      },
      writable: true,
      configurable: true,
    })
  }

  // Polyfill pour Array.prototype.includes
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      value: function(searchElement: any, fromIndex?: number) {
        if (this == null) {
          throw new TypeError('"this" is null or not defined')
        }
        
        const o = Object(this)
        const len = o.length >>> 0
        
        if (len === 0) {
          return false
        }
        
        const n = (fromIndex || 0) | 0
        let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0)
        
        while (k < len) {
          if (o[k] === searchElement) {
            return true
          }
          k++
        }
        
        return false
      },
      writable: true,
      configurable: true,
    })
  }

  // Polyfill pour String.prototype.includes
  if (!String.prototype.includes) {
    Object.defineProperty(String.prototype, 'includes', {
      value: function(search: any, start?: number) {
        if (typeof start !== 'number') {
          start = 0
        }
        
        if (start + search.length > this.length) {
          return false
        }
        
        return this.indexOf(search, start) !== -1
      },
      writable: true,
      configurable: true,
    })
  }

  // Polyfill pour Promise
  if (typeof Promise === 'undefined') {
    // Note: Dans un environnement de production, vous pourriez vouloir utiliser
    // un polyfill complet comme 'es6-promise'
    console.warn('Promise non supportée, certaines fonctionnalités asynchrones pourraient ne pas fonctionner')
  }

  // Polyfill pour requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback: FrameRequestCallback) {
      return window.setTimeout(callback, 1000 / 60)
    }
    
    window.cancelAnimationFrame = function(id: number) {
      window.clearTimeout(id)
    }
  }
}

// Export vide pour éviter les erreurs d'import
export {}