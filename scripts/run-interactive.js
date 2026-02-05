#!/usr/bin/env node

import { spawn } from "child_process";
import { createInterface } from "readline";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { closeWords } from "closewords";

const ALLOWED_FILENAMES = [
  "main.js",
  "main.cjs",
  "main.mjs",
  "main.ts",
  "main.coffee",
];

// ファイル拡張子に応じた実行コマンドを取得
function getRunCommand(fileName) {
  if (fileName === "main.ts") {
    return ["npx", "ts-node"];
  } else if (fileName === "main.coffee") {
    return ["npx", "coffee"];
  } else {
    return ["node"];
  }
}

// ディレクトリ内のメインファイルを検索
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
  console.log("\n空欄でEnterを押すとすべてのディレクトリを実行します");

  rl.question(
    "\n実行するディレクトリ名を入力してください: ",
    async (answer) => {
      rl.close();
      await handleSelection(answer.trim());
    },
  );
}

async function handleSelection(dirName) {
  if (dirName === "") {
    // Enterのみの場合はすべて実行
    console.log("\nすべてのディレクトリを順次実行します...\n");
    runAll(0);
  } else if (availableDirs.includes(dirName)) {
    console.log(`\n${dirName} を実行します...\n`);
    runOne(dirName);
  } else {
    // 最も近い名前を検索
    try {
      const closest = await closeWords(dirName, availableDirs);
      if (closest && closest.length > 0) {
        const targetDir = closest[0];
        console.log(
          `\n"${dirName}" が見つかりません。最も近い "${targetDir}" を実行します...\n`,
        );
        runOne(targetDir);
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

function runOne(dirName) {
  const dirPath = join(process.cwd(), "src", dirName);

  try {
    const fileName = findMainFile(dirPath);
    const scriptPath = join(dirPath, fileName);
    const [command, ...args] = getRunCommand(fileName);

    console.log(`ファイル: ${fileName}`);

    const child = spawn(command, [...args, scriptPath], {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      process.exit(code);
    });
  } catch (error) {
    console.error(`エラー: ${error.message}`);
    process.exit(1);
  }
}

function runAll(index) {
  if (index >= availableDirs.length) {
    console.log("\nすべての実行が完了しました。");
    return;
  }

  const dirName = availableDirs[index];
  console.log(`\n=== ${dirName} を実行 ===`);

  const dirPath = join(process.cwd(), "src", dirName);

  try {
    const fileName = findMainFile(dirPath);
    const scriptPath = join(dirPath, fileName);
    const [command, ...args] = getRunCommand(fileName);

    console.log(`ファイル: ${fileName}`);

    const child = spawn(command, [...args, scriptPath], {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(
          `\nエラー: ${dirName} が終了コード ${code} で終了しました。`,
        );
        process.exit(code);
      }
      runAll(index + 1);
    });
  } catch (error) {
    console.error(`\nエラー: ${error.message}`);
    process.exit(1);
  }
}
