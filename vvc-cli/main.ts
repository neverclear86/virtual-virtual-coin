import type { NostrPublicKey, WalletInfo } from "./lib/types.ts"
import { Command } from "cliffy"
import {
  changeWalletName,
  createWallet,
  getWalletInfo,
  listWallets,
  removeWallet,
  setDefault,
} from "./commands/wallet.ts"
import { sendVvcoin } from "./commands/send.ts"
import { updateWallet } from "./commands/wallet.ts"
import { dirtyDeedsDoneDirtCheep, showEvents } from "./commands/cheat.ts"

function displayWalletInfo(info: WalletInfo, showSecret = false) {
  console.log(`
    Wallet Name: ${info.name}
    Balance: ${info.balance}vvc
    Public Key: ${info.publicKey}
    Secret Key: ${showSecret ? info.secretKey : "nsec1*****"}
  `)
}

await new Command()
  .description(`
    vvcoin is virtual-virtual-coin CLI
  `)
  .version("0.0.1")
  .action(function () {
    this.showHelp()
  })
  .command(
    "wallet",
    new Command()
      .description("operate wallets")
      .option("-w, --wallet <name:string>", "wallet name")
      .option("-s, --show-secret", "display secret key")
      .option("-u, --update", "update wallet")
      .action(async (options) => {
        if (options.update) {
          await updateWallet(options.wallet)
        }
        const info = await getWalletInfo(options.wallet)
        displayWalletInfo(info, options.showSecret)
        Deno.exit(0)
      })
      .command(
        "create",
        new Command()
          .arguments("<name:string>")
          .option("-s, --show-secret", "display secret key")
          .action(async ({ showSecret }, name) => {
            const ret = await createWallet(name)
            displayWalletInfo(ret, showSecret)
          }),
      )
      .command(
        "list",
        new Command()
          .action(async () => {
            const list = await listWallets()
            console.log(list.join("\n"))
          }),
      )
      .command(
        "config",
        new Command().arguments("<wallet:string>")
          .option("-n, --name <name:string>", "change name", { required: true })
          .action(async (options, target) => {
            await changeWalletName(target, options.name)
            console.log(`Done: ${target} -> ${options.name}`)
          }),
      )
      .command(
        "remove",
        new Command().arguments("<wallet:string>")
          .action(async (_, target) => {
            const info = await getWalletInfo(target)
            await removeWallet(target)
            console.log("Wallet removed")
            displayWalletInfo(info)
            Deno.exit(0)
          }),
      )
      .command(
        "set",
        new Command().arguments("<wallet:string>")
          .action(async (_, target) => {
            await setDefault(target)
            console.log("Done")
          }),
      )
      .command(
        "update",
        new Command()
          .option("-w, --wallet <name:string>", "wallet name")
          .option("-a, --all", "update all wallets")
          .action(async (options) => {
            await updateWallet(options.wallet, options.all)
            console.log("Update Done!")
            Deno.exit(0)
          }),
      ),
  )
  .command(
    "send",
    new Command()
      .description("send vvc")
      .arguments("<target-pubkey:string> <amount:integer>")
      .option("-w, --wallet <name:string>", "wallet name")
      .option("-m, --memo <comment:string>", "send comment")
      .action(async (options, target, amount) => {
        const balance = await sendVvcoin(
          target as NostrPublicKey,
          amount,
          options.memo,
          options.wallet,
        )
        console.log(`Sent to ${target}: ${amount}vvc`)
        console.log(`Balance: ${balance}vvc`)
        Deno.exit(0)
      }),
  )
  .command(
    "debug",
    new Command()
      .description("do not use")
      .command(
        "cheat",
        new Command()
          .arguments("<amount:integer>")
          .option("-w, --wallet <name:string>", "wallet name")
          .action(async (options, amount) => {
            await dirtyDeedsDoneDirtCheep(amount, options.wallet)
            console.log("Ok, you are GOD")
            console.log(`Added ${amount}vvc your wallet`)
            Deno.exit(0)
          }),
      ).command(
        "events",
        new Command()
          .action(async () => {
            const events = await showEvents()
            console.log(JSON.stringify(events, undefined, 2))
            Deno.exit(0)
          }),
      ),
  )
  .parse(Deno.args)
