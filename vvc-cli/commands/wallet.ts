import { filterKeys } from "@std/collections/filter_keys"
import {
  getConfig,
  getDefault,
  getRelays,
  getSecret,
  saveConfig,
  setDefault as setDefaultWallet,
} from "../lib/config.ts"
import {
  approveRecieves,
  closeReleys,
  createKey,
  fetchCurrentBalance,
  getKeys,
} from "../lib/nostr.ts"
import { WalletInfo } from "../lib/types.ts"

export async function createWallet(walletName: string): Promise<WalletInfo> {
  const config = await getConfig()
  if (Object.keys(config.wallet).includes(walletName)) {
    throw Error(`already exists: ${walletName}`)
  }
  const keys = createKey()
  config.wallet[walletName] = { secret: keys.secretKey }
  if (config.defaultWallet == null) config.defaultWallet = walletName
  await saveConfig(config)
  return {
    ...keys,
    balance: 0,
    name: walletName,
  }
}

export async function changeWalletName(target: string, newName: string) {
  const config = await getConfig()
  if (!Object.keys(config.wallet).includes(target)) {
    throw Error(`no such wallet: ${target}`)
  }
  if (Object.keys(config.wallet).includes(newName)) {
    throw Error(`already exists: ${newName}`)
  }
  config.wallet = {
    ...filterKeys(config.wallet, (k) => k !== target),
    [newName]: config.wallet[target],
  }
  if (config.defaultWallet === target) {
    config.defaultWallet = newName
  }
  await saveConfig(config)
}

export async function removeWallet(target: string) {
  const config = await getConfig()
  if (!Object.keys(config.wallet).includes(target)) {
    throw Error(`no such wallet: ${target}`)
  }
  config.wallet = filterKeys(config.wallet, (k) => k !== target)
  if (config.defaultWallet === target) {
    config.defaultWallet = undefined
  }
  await saveConfig(config)
}

export async function listWallets(): Promise<string[]> {
  const config = await getConfig()
  return Object.keys(config.wallet)
}

export async function getWalletInfo(target?: string): Promise<WalletInfo> {
  target ??= await getDefault()
  if (target == null) throw Error("no wallet selected")
  const secret = await getSecret(target)
  if (secret == null) {
    throw Error(`no such wallet: ${target}`)
  }
  const keys = getKeys(secret)
  const releys = await getRelays()
  const balance = await fetchCurrentBalance(releys, keys.publicRaw)
  closeReleys(releys)
  return {
    ...keys,
    balance,
    name: target,
  }
}

export async function updateWallet(target?: string, isAll = false) {
  const targetList = isAll
    ? await listWallets()
    : [target ?? await getDefault()]
  if (targetList.length === 0 || !isStringArray(targetList)) {
    throw Error("no wallet selected")
  }
  const relays = await getRelays()
  return Promise.all(targetList.map(async (t) => {
    const secret = await getSecret(t)
    if (secret == null) {
      throw Error(`no such wallet: ${target}`)
    }
    const keys = getKeys(secret)
    return approveRecieves(relays, keys.publicRaw, keys.secretRaw)
  }))
  // closeReleys(relays)
}

export async function setDefault(target: string) {
  if (await getSecret(target) == null) {
    throw Error(`no such wallet: ${target}`)
  }
  return setDefaultWallet(target)
}

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every((v) => typeof v === "string")
}
