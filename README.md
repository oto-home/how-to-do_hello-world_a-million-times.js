# how-to-do_hello-world_a-million-times.js

[![PR Validation](https://github.com/oto-home/how-to-do_hello-world_a-million-times.js/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/oto-home/how-to-do_hello-world_a-million-times.js/actions/workflows/pr-validation.yml)

**JavaScript系で100万回Hello, Worldl!する方法**

ループや再帰を使わずに、100万回 "Hello, World!" を出力するクリエイティブな方法を集めています。  
Linux(Ubuntu)環境を想定しています。

> [!TIP]
> 元ネタ: https://youtu.be/OHOTGcQmndQ

---

## 📋 ルール

| # | ルール | 説明 |
| --- | :-- | :-- |
| 1 | ❌ ループ禁止 | `for` / `while` / `forEach` は使用不可 |
| 2 | ❌ 再帰禁止 | 関数の再帰呼び出しは使用不可 |
| 3 | 📏 1000バイト以内 | ソースコードのファイルサイズ制限 |
| 4 | 📁 単一ファイル | `src/[dirname]/main.*` + `README.md` のみ許可 |

## 🧪 テスト

### 対応ファイル形式

- `main.js` - JavaScript (ESM)
- `main.cjs` - JavaScript (CommonJS)
- `main.mjs` - JavaScript (ESM, 明示的)
- `main.ts` - TypeScript
- `main.coffee` - CoffeeScript

### テストの実行

```bash
# 依存関係のインストール
npm install

# 特定の実装をテスト
npm test [dirname]

# 全てのテストを実行
npm run test:all

# ウォッチモードでテストを実行
npm run test:watch
```

### テスト内容

各 `src/[dirname]/main.*` に対して以下のテストを実行します：

| チェック項目 | 内容 |
| :-- | :-- |
| 📁 ファイル存在 | ディレクトリ内に唯一のメインファイルが存在すること |
| 📏 サイズ制限 | コードが1000バイト以内であること |
| 🚫 禁止キーワード | `for`, `while`, `forEach` が使用されていないこと |
| 🔄 再帰チェック | 関数が自身を再帰的に呼び出していないこと |
| ✅ 出力確認 | 正確に100万回 "Hello, World!" が出力されること |

## 🤝 貢献

新しい実装のアイデアがありますか？ぜひ貢献してください！

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

### クイックスタート

```bash
# 1. リポジトリをフォーク & クローン
git clone https://github.com/YOUR_USERNAME/how-to-do_hello-world_a-million-times.js.git

# 2. 新しい実装ディレクトリを作成
mkdir src/[your_method_name]

# 3. メインファイルを作成
# src/[your_method_name]/main.js (or .ts, .coffee, etc.)

# 4. テストを実行
npm test [your_method_name]

# 5. Pull Requestを作成！
```

> [!WARNING]
> `src/[dirname]/main.*` と `src/[dirname]/README.md` 以外のファイルを変更するPRは自動的にクローズされます。

### 貢献者

[![Contributors](https://contrib.rocks/image?repo=oto-home/how-to-do_hello-world_a-million-times.js)](https://github.com/oto-home/how-to-do_hello-world_a-million-times.js/graphs/contributors)
