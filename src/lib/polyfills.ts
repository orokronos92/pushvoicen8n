// Version simple des polyfills
if (typeof window !== 'undefined') {
  require('regenerator-runtime/runtime');
}

// Export vide pour éviter les erreurs d'import
export {}