import { nip19 } from "nostr-tools"
import { getRelays } from "../lib/config.ts"
import { getDefault, getSecret } from "../lib/config.ts"
import { now } from "../lib/date.ts"
import { sendCoin } from "../lib/nostr.ts"
import { getKeys } from "../lib/nostr.ts"
import type { NostrPublicKey } from "../lib/types.ts"
import { closeReleys } from "../lib/nostr.ts"

export async function sendVvcoin(
  target: NostrPublicKey,
  amount: number,
  memo?: string,
  wallet?: string,
) {
  wallet ??= await getDefault()
  if (wallet == null) throw Error("no wallet selected")
  const secret = await getSecret(wallet)
  if (secret == null) {
    throw Error(`no such wallet: ${wallet}`)
  }
  const keys = getKeys(secret)
  const releys = await getRelays()
  const balance = await sendCoin(
    releys,
    keys.publicRaw,
    keys.secretRaw,
    nip19.decode(target).data,
    amount,
    memo,
    now(),
  )
  closeReleys(releys)
  return balance
}
