import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, statSync, readdirSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

const EXPECTED_COUNT = 1000000;
const MAX_FILE_SIZE = 1000; // bite
const ALLOWED_FILENAMES = [
  "main.js",
  "main.cjs",
  "main.mjs",
  "main.ts",
  "main.coffee",
];

// src/ からディレクトリを取得
const srcDir = join(process.cwd(), "src");
const allTargets = readdirSync(srcDir)
  .filter((name) => {
    const fullPath = join(srcDir, name);
    return statSync(fullPath).isDirectory();
  })
  .sort();

const targetFilter = process.env.TARGET;
const testTargets = targetFilter
  ? allTargets.filter((t) => t === targetFilter)
  : allTargets;

if (targetFilter && testTargets.length === 0) {
  console.warn(
    `警告: 指定されたターゲット "${targetFilter}" が見つかりません。利用可能: ${allTargets.join(", ")}`,
  );
}

// mainを探索
function findMainFile(dirPath) {
  const files = readdirSync(dirPath).filter((f) => {
    const fullPath = join(dirPath, f);
    return statSync(fullPath).isFile();
  });

  if (files.length === 0) {
    throw new Error(`ディレクトリ内にファイルが存在しません: ${dirPath}`);
  }

  if (files.length > 1) {
    throw new Error(
      `ディレクトリ内に複数のファイルが存在します: ${files.join(", ")}`,
    );
  }

  const fileName = files[0];
  if (!ALLOWED_FILENAMES.includes(fileName)) {
    throw new Error(
      `許可されていないファイル名です: ${fileName}。許可: ${ALLOWED_FILENAMES.join(", ")}`,
    );
  }

  return fileName;
}

// ファイル拡張子に応じた実行コマンドを取得
function getRunCommand(fileName) {
  if (fileName === "main.ts") {
    return ["npx", "ts-node", "--esm"];
  } else if (fileName === "main.coffee") {
    return ["npx", "coffee"];
  } else {
    return ["node"];
  }
}

describe("Hello World 100万回出力テスト", () => {
  testTargets.forEach((target) => {
    describe(`src/${target}/`, () => {
      const dirPath = join(process.cwd(), "src", target);
      let fileName;
      let filePath;
      let fileContent;

      beforeEach(() => {
        fileName = findMainFile(dirPath);
        filePath = join(dirPath, fileName);
        fileContent = readFileSync(filePath, "utf-8");
      });

      it("ディレクトリ内に唯一のファイルが存在すること", () => {
        const files = readdirSync(dirPath).filter((f) => {
          const fullPath = join(dirPath, f);
          return statSync(fullPath).isFile();
        });
        expect(files.length).toBe(1);
      });

      it("ファイル名が許可されたもの（main.js/main.cjs/main.mjs/main.ts）であること", () => {
        expect(ALLOWED_FILENAMES).toContain(fileName);
      });

      it("コードが1000バイト以内であること", () => {
        const fileSize = statSync(filePath).size;
        expect(fileSize).toBeLessThanOrEqual(MAX_FILE_SIZE);
      });

      it("禁止されたキーワード (for, while, forEach) を使用していないこと", () => {
        // コメントを除去
        const codeWithoutComments = fileContent
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*/g, "");

        expect(codeWithoutComments).not.toMatch(/\bfor\s*\(/);
        expect(codeWithoutComments).not.toMatch(/\bwhile\s*\(/);
        expect(codeWithoutComments).not.toMatch(/\.forEach\s*\(/);
      });

      it("再帰呼び出しを使用していないこと", () => {
        // 関数定義とその内部での自己呼び出しをチェック
        const functionNames = [];
        const functionBodies = new Map();

        // function宣言をチェック
        const functionMatches = fileContent.matchAll(
          /function\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/g,
        );
        for (const match of functionMatches) {
          const name = match[1];
          const body = match[2];
          functionNames.push(name);
          functionBodies.set(name, body);
        }

        // const/let/var で定義されたアロー関数をチェック
        const arrowMatches = fileContent.matchAll(
          /(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*([^;]+)/g,
        );
        for (const match of arrowMatches) {
          const name = match[1];
          const body = match[2];
          functionNames.push(name);
          functionBodies.set(name, body);
        }

        // 各関数の本体内で自己呼び出しがないかチェック
        functionBodies.forEach((body, name) => {
          const callPattern = new RegExp(`\\b${name}\\s*\\(`);
          if (callPattern.test(body)) {
            throw new Error(
              `再帰呼び出しが検出されました: 関数 ${name} が自身を呼び出しています`,
            );
          }
        });
      });

      it('100万回 "Hello, World!" を出力すること', async () => {
        const [command, ...args] = getRunCommand(fileName);
        const output = await new Promise((resolve, reject) => {
          const env = { ...process.env };
          if (fileName === "main.ts") {
            env.NODE_OPTIONS = "--loader ts-node/esm";
          }
          const child = spawn(command, [...args, filePath], {
            shell: true,
            env,
          });
          let stdout = "";
          let stderr = "";

          child.stdout.on("data", (data) => {
            stdout += data.toString();
          });

          child.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          child.on("close", (code) => {
            if (code !== 0) {
              reject(new Error(`プロセスがエラーで終了しました: ${stderr}`));
            } else {
              resolve(stdout);
            }
          });
        });

        // "Hello, World!" の出現回数をカウント
        const matches = output.match(/Hello, World!/g);
        const count = matches ? matches.length : 0;

        expect(count).toBe(EXPECTED_COUNT);
      });
    });
  });
});
