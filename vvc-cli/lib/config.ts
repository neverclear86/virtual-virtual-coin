import getDataDir from "dir/data_dir"
import { join } from "@std/path"
import { exists } from "@std/fs"
import type { AppConfig, WebSocketURI } from "./types.ts"

// TODO DenoKVのほうがいいんじゃあないか

const APP_NAME = "vvcoin"
const CONFIG_FILE = "config.json"

const DEFAULT_RELAYS = [
  "wss://relay-jp.nostr.wirednet.jp/",
  // "wss://nostr-relay.nokotaro.com",
  // "wss://yabu.me",
] as const satisfies WebSocketURI[]

let configCache: AppConfig | undefined

async function getConfigDir() {
  const dataDir = getDataDir()
  if (dataDir == null) throw Error("no such user data dir.")
  const configDir = join(dataDir, APP_NAME)
  if (!(await exists(configDir))) {
    await Deno.mkdir(configDir)
  }
  return configDir
}

export async function getConfig(): Promise<AppConfig> {
  if (configCache != null) return configCache
  const configFilePath = join(await getConfigDir(), CONFIG_FILE)
  try {
    const text = await Deno.readTextFile(configFilePath)
    configCache = JSON.parse(text)
  } catch (_) {
    configCache = { wallet: {}, relays: DEFAULT_RELAYS }
  }
  return configCache!
}

export async function saveConfig(config: AppConfig): Promise<void> {
  configCache = config
  const configFilePath = join(await getConfigDir(), CONFIG_FILE)
  await Deno.writeTextFile(configFilePath, JSON.stringify(config, undefined, 2))
}

export async function getSecret(walletName: string) {
  const config = await getConfig()
  const wallet = config.wallet[walletName]
  if (wallet == null) return undefined
  return wallet.secret
}

export async function getRelays() {
  const config = await getConfig()
  return config.relays
}

export async function getDefault() {
  const config = await getConfig()
  return config.defaultWallet
}

export async function setDefault(walletName?: string) {
  const config = await getConfig()
  return saveConfig({ ...config, defaultWallet: walletName })
}
