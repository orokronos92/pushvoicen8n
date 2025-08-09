// Import des polyfills complets avec core-js
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Déclarer regeneratorRuntime comme variable globale
declare global {
  interface Window {
    regeneratorRuntime: any;
  }
}

// Rendre regeneratorRuntime disponible globalement
if (typeof window !== 'undefined') {
  window.regeneratorRuntime = require('regenerator-runtime/runtime');
}

// Export vide pour éviter les erreurs d'import
export {}