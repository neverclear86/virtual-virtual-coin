export type WebSocketURI = `wss://${string}`
export type NostrPublicKey = `npub1${string}`
export type NostrSecretKey = `nsec1${string}`

export interface WalletConfig {
  secret: NostrSecretKey
}

export interface AppConfig {
  wallet: {
    [name: string]: WalletConfig
  }
  relays: WebSocketURI[]
  defaultWallet?: string
}

export type VvcEventType = "send" | "fix"

export interface SendEventContent {
  type: "send"
  amount: number
  memo?: string
}

export interface FixEventContent {
  type: "fix"
  balance: number
}

export type VvcEventContent = SendEventContent | FixEventContent

export interface KeyInfo {
  secretRaw: Uint8Array
  secretKey: NostrSecretKey
  publicRaw: string
  publicKey: NostrPublicKey
}

export interface WalletInfo extends KeyInfo {
  balance: number
  name: string
}
