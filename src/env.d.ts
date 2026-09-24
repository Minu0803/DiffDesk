/// <reference types="vite/client" />

import type { DiffDeskApi } from '../shared/ipc'

declare global {
  interface Window {
    api: DiffDeskApi
  }
}

export {}
