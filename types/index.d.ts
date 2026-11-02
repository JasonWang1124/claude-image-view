export type PastedImage = {
  n: number
  /** Absolute path of the PNG to draw (the cached paste or its converted copy); null when it can't be found. */
  path: string | null
  /** Pixel size; null when unknown, and the tile falls back to a default shape. */
  size: { width: number; height: number } | null
}

/** The iTerm2 offer to turn Claude Code's terminal images on: shown, taken, declined, or not applicable. */
export type ForceState =
  | { status: 'none' }
  | { status: 'needed' }
  | { status: 'dismissed' }
  | { status: 'written'; path: string }
  | { status: 'failed'; reason: string }

declare module 'claude-code' {
  interface PluginState {
    'image-view': { images: PastedImage[]; force: ForceState }
  }
}
