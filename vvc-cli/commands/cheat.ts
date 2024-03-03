import { type EventTemplate, finalizeEvent, SimplePool } from "nostr-tools"
import { now } from "../lib/date.ts"
import type { FixEventContent, WebSocketURI } from "../lib/types.ts"
import { getRelays } from "../lib/config.ts"
import { getDefault, getSecret } from "../lib/config.ts"
import { getKeys } from "../lib/nostr.ts"

export async function dirtyDeedsDoneDirtCheep(amount: number, wallet?: string) {
  wallet ??= await getDefault()
  if (wallet == null) throw Error("no wallet selected")
  const secret = await getSecret(wallet)
  if (secret == null) {
    throw Error(`no such wallet: ${wallet}`)
  }
  const keys = getKeys(secret)
  const releys = await getRelays()
  await cashCow(releys, keys.publicRaw, keys.secretRaw, amount)
}

const VVCOIN_KIND = 2940
const VVCOIN_INFO_KIND = 12940

async function cashCow(
  relays: WebSocketURI[],
  myPublicKey: string,
  secret: Uint8Array,
  balance: number,
  datetime: number = now(),
) {
  const transferEvent = {
    kind: VVCOIN_INFO_KIND,
    created_at: datetime,
    tags: [
      ["p", myPublicKey],
    ],
    content: JSON.stringify({ balance, type: "fix" } satisfies FixEventContent),
  } satisfies EventTemplate
  const signed = finalizeEvent(transferEvent, secret)
  const pool = new SimplePool()
  await Promise.all(pool.publish(relays, signed))
  pool.close(relays)
}

export async function showEvents() {
  const releys = await getRelays()
  const events = await queryEvents(releys)
  return events
}

async function queryEvents(relays: WebSocketURI[]) {
  const pool = new SimplePool()
  const events = await pool.querySync(relays, {
    kinds: [VVCOIN_KIND, VVCOIN_INFO_KIND],
  })
  pool.close(relays)
  return events
}
