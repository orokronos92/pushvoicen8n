'use client'

import React, { useEffect } from 'react'

/**
 * Composant Providers pour charger les polyfills nécessaires
 * Ce composant doit être monté le plus haut possible dans la hiérarchie client
 * pour garantir que les polyfills sont chargés avant tout composant qui en dépend
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Charger regenerator-runtime côté client uniquement
    if (typeof window !== 'undefined') {
      try {
        // Utiliser require pour charger regenerator-runtime
        const regeneratorRuntime = require('regenerator-runtime/runtime');
        (window as any).regeneratorRuntime = regeneratorRuntime;
        console.log('regenerator-runtime loaded successfully');
      } catch (error) {
        console.error('Failed to load regenerator-runtime:', error);
      }
    }
  }, [])

  return <>{children}</>
}