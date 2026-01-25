import '@testing-library/jest-dom'

// Define global variables that Vite normally injects
// __APP_VERSION__ is declared in vite-env.d.ts, so we just assign the value
;(globalThis as unknown as { __APP_VERSION__: string }).__APP_VERSION__ = '0.0.0-test'
