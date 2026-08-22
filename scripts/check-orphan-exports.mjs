#!/usr/bin/env node
/**
 * 差分で追加・変更したファイルの export が、どこからも参照されていないかを調べる。
 *
 * 共通化のためにコンポーネントを切り出したのに差し替えを忘れる、という抜けを
 * 拾うために置いている。「重複を減らすつもりが、使われない新ファイルと重複した
 * 実装が同時に残る」という形の事故が実際に起きた。
 *
 * 使い方:
 *   node scripts/check-orphan-exports.mjs [base]
 *
 * base の既定は develop。参照が無い export が見つかったら exit 1。
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.argv[2] ?? "develop";

/** 参照を数えなくてよいもの。 */
const IGNORED_PATHS = [
  /\.test\.tsx?$/,
  /\.integration\.test\.tsx?$/,
  // Next.js の規約ファイルはフレームワークが呼ぶ。
  /\/(page|layout|route|sitemap|robots|not-found|error|loading|template)\.tsx?$/,
  /\/(middleware|instrumentation)\.ts$/,
  // 設定ファイルは実行環境が読む。
  /\.config\.[cm]?[jt]s$/,
];

/** default export と、フレームワークが名前で拾う export。 */
const IGNORED_NAMES = new Set(["default", "metadata", "generateMetadata"]);

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function changedFiles() {
  return git(["diff", "--name-only", "--diff-filter=AM", `${base}...HEAD`])
    .split("\n")
    .filter((path) => /\.tsx?$/.test(path))
    .filter((path) => !IGNORED_PATHS.some((pattern) => pattern.test(path)));
}

/**
 * export された名前を拾う。
 *
 * 構文解析まではしない。`export function foo` / `export const foo` /
 * `export type Foo` / `export { foo }` の形だけを見る。取りこぼしても
 * 誤検知にはならず、見逃しになるだけなので、この粗さで足りる。
 */
function exportedNames(source) {
  const names = new Set();

  const declaration =
    /^export\s+(?:async\s+)?(?:function|const|let|class|type|interface|enum)\s+(\w+)/gm;
  for (const match of source.matchAll(declaration)) {
    names.add(match[1]);
  }

  const braced = /^export\s+(?:type\s+)?\{([^}]+)\}/gm;
  for (const match of source.matchAll(braced)) {
    for (const part of match[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }

  for (const name of IGNORED_NAMES) names.delete(name);
  return [...names];
}

/** その名前を、自分以外のファイルが書いているか。 */
function isReferenced(name, ownPath) {
  let output = "";
  try {
    output = git([
      "grep",
      "-l",
      "-w",
      "-e",
      name,
      "--",
      "web/src",
      "admin/src",
      "packages",
      "tests",
    ]);
  } catch {
    // git grep は一致0件で exit 1 を返す。
    return false;
  }

  return output
    .split("\n")
    .filter(Boolean)
    .some((path) => path !== ownPath);
}

const orphans = [];
for (const path of changedFiles()) {
  let source = "";
  try {
    source = readFileSync(path, "utf8");
  } catch {
    continue;
  }

  for (const name of exportedNames(source)) {
    if (!isReferenced(name, path)) {
      orphans.push({ path, name });
    }
  }
}

if (orphans.length === 0) {
  console.log("参照の無い export はありません。");
  process.exit(0);
}

console.error("どこからも参照されていない export があります:\n");
for (const { path, name } of orphans) {
  console.error(`  ${path}: ${name}`);
}
console.error(
  "\n切り出したまま差し替えを忘れていないか確認してください。" +
    "意図して外部に出していない場合は export を外すか、ファイルを削除してください。"
);
process.exit(1);
