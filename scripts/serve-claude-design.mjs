#!/usr/bin/env node
/**
 * Claude Design の `.dc.html` をブラウザで開ける形にして配信する。
 *
 * `.dc.html` は `window.React` / `window.ReactDOM` が用意済みであることを
 * 前提にしているため、そのまま開いても何も描画されない。UMD ビルドを先に
 * 読み込む形へ書き換えたコピーを作って配信する。
 *
 * ソースを読んで仕様を推測すると外す。`hint-placeholder-val` はプレビュー用の
 * 仮値で作者の選択ではなく、スクリプト側の `?? "既定値"` も `data-props` の
 * `default` と食い違うことがある。どちらが効くかは描画しないと分からない。
 *
 * 使い方:
 *   node scripts/serve-claude-design.mjs <デザインを置いたディレクトリ> [port]
 *
 * ディレクトリには Claude Design からダウンロードした `.dc.html` と、
 * 同梱の `support.js` などの資材を置く。
 */

import { createServer } from "node:http";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const dir = resolve(process.argv[2] ?? ".");
const port = Number(process.argv[3] ?? 8780);

const REACT_UMD = [
  '<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>',
  '<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>',
].join("\n");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** support.js の読み込み前に React を挿す。既に入っていれば触らない。 */
function withReact(html) {
  if (html.includes("react.production")) return html;

  const marker = '<script src="./support.js"></script>';
  if (!html.includes(marker)) {
    throw new Error(
      "support.js の読み込み位置が見つかりません。デザイン一式を同じディレクトリに置いてください。"
    );
  }

  return html.replace(marker, `${REACT_UMD}\n${marker}`);
}

const server = createServer((request, response) => {
  const path = decodeURIComponent((request.url ?? "/").split("?")[0]);

  if (path === "/") {
    const designs = readdirSync(dir).filter((name) => name.endsWith(".html"));
    const links = designs
      .map((name) => `<li><a href="/${name}">${name}</a></li>`)
      .join("");
    response.writeHead(200, { "content-type": MIME[".html"] });
    response.end(`<ul>${links}</ul>`);
    return;
  }

  // ディレクトリの外へ出る参照を弾く。
  const file = resolve(join(dir, path));
  if (!file.startsWith(dir) || !existsSync(file)) {
    response.writeHead(404).end("not found");
    return;
  }

  const extension = extname(file);
  try {
    const body =
      extension === ".html"
        ? withReact(readFileSync(file, "utf8"))
        : readFileSync(file);
    response.writeHead(200, {
      "content-type": MIME[extension] ?? "application/octet-stream",
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
});

server.listen(port, () => {
  console.log(`デザインを配信します: http://localhost:${port}/`);
  console.log(`配信元: ${dir}`);
});
