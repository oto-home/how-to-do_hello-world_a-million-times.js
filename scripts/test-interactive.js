#!/usr/bin/env node

import { spawn } from "child_process";
import { createInterface } from "readline";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { closeWords } from "closewords";

// srcディレクトリから利用可能なディレクトリを取得
const srcDir = join(process.cwd(), "src");
const availableDirs = readdirSync(srcDir)
  .filter((name) => {
    const fullPath = join(srcDir, name);
    return statSync(fullPath).isDirectory();
  })
  .sort();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// コマンドライン引数をチェック
const argDir = process.argv[2];

if (argDir) {
  // 引数が指定されている場合は対話をスキップ
  handleSelection(argDir.trim());
} else {
  // 引数がない場合は対話式
  console.log("利用可能なディレクトリ:");
  availableDirs.forEach((dir) => {
    console.log(`  - ${dir}`);
  });
  console.log("\n空欄でEnterを押すとすべてのディレクトリをテストします");

  rl.question(
    "\nテストするディレクトリ名を入力してください: ",
    async (answer) => {
      rl.close();
      await handleSelection(answer.trim());
    },
  );
}

async function handleSelection(dirName) {
  let target = null;

  if (dirName === "") {
    // Enterのみの場合はすべてテスト
    console.log("\nすべてのディレクトリをテストします...\n");
  } else {
    // 名前の場合
    if (availableDirs.includes(dirName)) {
      target = dirName;
      console.log(`\n${target} をテストします...\n`);
    } else {
      // 最も近い名前を検索
      try {
        const closest = await closeWords(dirName, availableDirs);
        if (closest && closest.length > 0) {
          target = closest[0];
          console.log(
            `\n"${dirName}" が見つかりません。最も近い "${target}" をテストします...\n`,
          );
        } else {
          console.error(`エラー: "${dirName}" が見つかりません。`);
          console.log("利用可能なディレクトリ:", availableDirs.join(", "));
          process.exit(1);
        }
      } catch (error) {
        console.error(`エラー: ${error.message}`);
        process.exit(1);
      }
    }
  }

  // vitestを実行
  const env = { ...process.env };
  if (target) {
    env.TARGET = target;
  }

  const vitest = spawn("npx", ["vitest", "run"], {
    env,
    stdio: "inherit",
    shell: true,
  });

  vitest.on("exit", (code) => {
    process.exit(code);
  });
}
