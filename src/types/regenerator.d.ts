declare const regeneratorRuntime: any;
declare global {
  var regeneratorRuntime: any;
}

declare module 'regenerator-runtime/runtime' {
  const regeneratorRuntime: any;
  export default regeneratorRuntime;
  export = regeneratorRuntime;
}

// Déclaration pour l'import dynamique
declare module 'regenerator-runtime/runtime.js' {
  const regeneratorRuntime: any;
  export default regeneratorRuntime;
  export = regeneratorRuntime;
}
export {};