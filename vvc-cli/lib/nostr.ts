import {
  type EventTemplate,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip19,
  type NostrEvent,
  SimplePool,
} from "nostr-tools"
import { maxOf } from "@std/collections/max_of"
import { sumOf } from "@std/collections/sum_of"
import { now } from "./date.ts"
import type { VvcEventContent, WebSocketURI } from "./types.ts"
import { KeyInfo } from "./types.ts"
import { FixEventContent } from "./types.ts"
import { SendEventContent } from "./types.ts"

const VVCOIN_KIND = 2940
const VVCOIN_INFO_KIND = 12940

const pool = new SimplePool()

function extructContent(event: NostrEvent): VvcEventContent {
  return JSON.parse(event.content)
}

async function fireSendEvent(
  relays: WebSocketURI[],
  secret: Uint8Array,
  targetPublicKey: string,
  amount: number,
  memo?: string,
  datetime = now(),
) {
  const sendEvent = {
    kind: VVCOIN_KIND,
    created_at: datetime,
    tags: [
      ["p", targetPublicKey],
    ],
    content: JSON.stringify(
      { amount, memo, type: "send" } satisfies SendEventContent,
    ),
  } satisfies EventTemplate
  const signedSendEvent = finalizeEvent(sendEvent, secret)
  const sendId = await Promise.any(pool.publish(relays, signedSendEvent))
  return sendId
}

export async function sendCoin(
  relays: WebSocketURI[],
  myPublicKey: string,
  secret: Uint8Array,
  targetPublicKey: string,
  amount: number,
  memo?: string,
  datetime = now(),
) {
  await approveRecieves(relays, myPublicKey, secret)
  const lastFix = await fetchLastFix(relays, myPublicKey)
  const balance = lastFix?.content.balance ?? 0
  if (balance < amount) throw Error("no money")
  const sendId = await fireSendEvent(
    relays,
    secret,
    targetPublicKey,
    amount,
    memo,
    datetime,
  )
  const sentBalance = balance - amount
  await fixCurrent(
    relays,
    myPublicKey,
    secret,
    sentBalance,
    [sendId],
    datetime,
  )
  return sentBalance
}

function fixCurrent(
  relays: WebSocketURI[],
  myPublicKey: string,
  secret: Uint8Array,
  balance: number,
  adaptedEvents: string[],
  datetime: number = now(),
) {
  if (adaptedEvents.length === 0) return undefined
  const fixEvent = {
    kind: VVCOIN_INFO_KIND,
    created_at: datetime,
    tags: [
      ["p", myPublicKey],
      ...adaptedEvents.map((id) => ["e", id]),
    ],
    content: JSON.stringify({ balance, type: "fix" } satisfies FixEventContent),
  } satisfies EventTemplate
  const signed = finalizeEvent(fixEvent, secret)
  return Promise.all(pool.publish(relays, signed))
}

async function fetchLastFix(
  relays: WebSocketURI[],
  myPublicKey: string,
) {
  const event = await pool.get(relays, {
    kinds: [VVCOIN_INFO_KIND],
    "#p": [myPublicKey],
    limit: 1,
    authors: [myPublicKey],
  })
  if (event == null) return event
  return {
    ...event,
    content: extructContent(event) as FixEventContent,
  }
}

export async function fetchCurrentBalance(
  relays: WebSocketURI[],
  myPublicKey: string,
) {
  const lastFix = await fetchLastFix(relays, myPublicKey)
  if (lastFix == null) return 0
  return lastFix.content.balance
}

async function fetchSendEventsSince(
  relays: WebSocketURI[],
  since: number,
  myPublicKey: string,
) {
  const events = await pool.querySync(relays, {
    kinds: [VVCOIN_KIND],
    since,
    "#p": [myPublicKey],
  })
  return events.filter((e) => e.pubkey !== myPublicKey).map((e) => ({
    ...e,
    content: extructContent(e) as SendEventContent,
  }))
}

export async function approveRecieves(
  relays: WebSocketURI[],
  myPublicKey: string,
  secret: Uint8Array,
) {
  const lastFix = await fetchLastFix(relays, myPublicKey)
  const recieves = await fetchSendEventsSince(
    relays,
    lastFix ? lastFix.created_at + 1 : 0,
    myPublicKey,
  )
  const latestRecievedAt = maxOf(recieves, (e) => e.created_at)
  if (latestRecievedAt == null || recieves.length === 0) return
  return fixCurrent(
    relays,
    myPublicKey,
    secret,
    (lastFix?.content.balance ?? 0) +
      sumOf(recieves, (e) => e.content.amount),
    recieves.map((e) => e.id),
    latestRecievedAt,
  )
}

export function createKey(): KeyInfo {
  const secretRaw = generateSecretKey()
  const publicRaw = getPublicKey(secretRaw)
  return {
    secretRaw,
    secretKey: nip19.nsecEncode(secretRaw),
    publicRaw,
    publicKey: nip19.npubEncode(publicRaw),
  }
}

export function getKeys(secretKey: `nsec1${string}`): KeyInfo {
  const { data: secretRaw } = nip19.decode(secretKey)
  const publicRaw = getPublicKey(secretRaw)
  return {
    secretRaw,
    secretKey,
    publicRaw,
    publicKey: nip19.npubEncode(publicRaw),
  }
}

export function closeReleys(releys: WebSocketURI[]) {
  pool.close(releys)
}
