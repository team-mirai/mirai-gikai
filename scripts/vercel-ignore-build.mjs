// Vercel Ignored Build Step から実行されるスクリプト。
// exit 0 = ビルドをスキップ / exit 1 = ビルドを続行する仕様。
// https://vercel.com/docs/project-configuration/vercel-json#ignorecommand
//
// feature ブランチは open な PR があるときだけ Preview をビルドする。
// main / develop の git 連携ビルドは deploymentEnabled で無効化済みだが、
// deploy.yml の Deploy Hook 経由のビルドでも ignoreCommand が評価される場合に
// 本番 / staging のビルドを止めないよう、常に続行する。
// 判定不能なケース（環境変数欠落・GitHub API のレート制限やエラー）は
// 安全側（ビルド続行）に倒す。

const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";
const owner = process.env.VERCEL_GIT_REPO_OWNER ?? "";
const repo = process.env.VERCEL_GIT_REPO_SLUG ?? "";

function build(reason) {
  console.log(`Proceeding with build: ${reason}`);
  process.exit(1);
}

function skip(reason) {
  console.log(`Skipping build: ${reason}`);
  process.exit(0);
}

if (branch === "main" || branch === "develop") {
  build(`branch "${branch}" deploys via deploy hook`);
}

if (!branch || !owner || !repo) {
  build("missing VERCEL_GIT_* environment variables");
}

try {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=1&head=${owner}:${encodeURIComponent(branch)}`;
  const headers = { accept: "application/vnd.github+json" };
  // 無認証だと 60 req/h/IP のレート制限があるため、Vercel の環境変数に
  // GITHUB_TOKEN が設定されていれば認証付きで呼ぶ（未設定でも動作する）。
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  const pulls = await res.json();

  if (!Array.isArray(pulls)) {
    const body = JSON.stringify(pulls).slice(0, 200);
    build(`unexpected GitHub API response (status ${res.status}): ${body}`);
  } else if (pulls.length > 0) {
    build(`open PR found for branch "${branch}"`);
  } else {
    skip(`no open PR for branch "${branch}"`);
  }
} catch (error) {
  build(`GitHub API request failed (${error})`);
}
