# VVC
VVC(`Virtual Virtual Coin`)は[Nostr](https://nostr.com/)プロトコルを利用した、ウォレットの作成、送金ができる仮想仮想通貨(フェイク通貨)です
この通貨は完全に価値が無く、リアルマネーへのトレードは一切出来ません

> [エンジニア集会ハッカソン#0](https://www.youtube.com/watch?v=Q28jUVoY0GY) テーマ:`バーチャルな〇〇` 参加作品

## VVC-CLI
VVCをCLIで操作するためのツール

### Sub Commands
#### `wallet`
ウォレット(Nostrアカウント)を操作する
- (none)
  - ウォレット情報と残高を表示
- `create`
  - ウォレット(秘密鍵)を作成する
- `list`
  - ローカルにあるウォレットのリストを表示
- `config`
  - ウォレットの設定
  - 今の所名前変更だけ
- `remove`
  - ウォレットの削除
- `set`
  - デフォルトウォレットを設定
- `update`
  - ウォレットの残高を再計算

#### `send`
送金する

#### `debug`
デバッグ用