---
name: linear
description: |
  Linear と対話するためのスキル。Linear MCP サーバー（`mcp__linear__*` ツール）を
  優先的に使用し、MCP でカバーされない生の GraphQL 操作（イントロスペクション、
  ファイルアップロードなど）は `linear_graphql` クライアントツールにフォールバックする。
---

# Linear

Linear との対話には 2 つの経路がある:

1. **Linear MCP サーバー** — `mcp__linear__*` 系の高レベルツール（`list_issues`、`get_issue`、`save_comment` など）。通常はこちらを優先する。
2. **`linear_graphql` クライアントツール** — Symphony の app-server セッションが公開する生の GraphQL クライアント。MCP に存在しない操作（ファイルアップロード、イントロスペクション、新しい mutation の試行）に使う。

どちらも利用できない場合は停止し、ユーザーに Linear の設定を依頼する。

## ツール選択ルール

以下の順で経路を選ぶ:

1. **MCP に対応するツールがあれば MCP を使う**（issue/コメント/プロジェクト/チームの CRUD はほぼ MCP でカバーされる）。
2. **MCP に対応する操作がない、または下記の限定ケース**では `linear_graphql` を使う:
   - ファイル／動画アップロード（`fileUpload` mutation）
   - スキーマイントロスペクション（`__type` クエリ）
   - MCP がまだサポートしていない新しい／未知の mutation
   - レアな input 型のフィールド構造を確認する必要があるとき

## MCP の使用上の注意

- 文字列値を渡すときは、エスケープシーケンスを含めず内容をそのまま送る。たとえば markdown 本文の改行はリテラル `\n` ではなく実際の改行を使う。
- 1 回のツール呼び出しにつき 1 つの操作を行う。
- 必要なフィールド／引数のみを渡し、不要な更新を避ける。

## `linear_graphql` の使用上の注意

ツール入力:

```json
{
  "query": "query or mutation document",
  "variables": {
    "optional": "graphql variables object"
  }
}
```

挙動:

- 1 回のツール呼び出しにつき 1 つの GraphQL オペレーションを送る。
- ツール呼び出し自体は完了していても、トップレベルの `errors` 配列がある場合は失敗した GraphQL オペレーションとして扱う。
- query/mutation は狭くスコープし、必要なフィールドのみを要求する。

## 一般的なワークフロー

各ワークフローで、MCP 経路を優先し、`linear_graphql` 経路はフォールバックとして示す。

### key・identifier・id で issue をクエリする

ルックアップは段階的に使う: key -> identifier 検索 -> 内部 id。

**MCP 経路:**

- チケットキー（例: `MT-686`）から取得: `mcp__linear__get_issue` に `id: "MT-686"` を渡す（識別子も受け付ける）。
- フィルタ検索: `mcp__linear__list_issues` を使って `team`、`project`、`assignee`、`state`、`label`、`createdAt` などで絞り込む。
- issue の詳細／添付／コメントが必要なら、`get_issue` の応答や個別 API（`list_comments`、`get_attachment`）を組み合わせる。

**`linear_graphql` フォールバック:**

issue キーで検索:

```graphql
query IssueByKey($key: String!) {
  issue(id: $key) {
    id
    identifier
    title
    state {
      id
      name
      type
    }
    project {
      id
      name
    }
    branchName
    url
    description
    updatedAt
    links {
      nodes {
        id
        url
        title
      }
    }
  }
}
```

identifier フィルタで検索:

```graphql
query IssueByIdentifier($identifier: String!) {
  issues(filter: { identifier: { eq: $identifier } }, first: 1) {
    nodes {
      id
      identifier
      title
      state {
        id
        name
        type
      }
      project {
        id
        name
      }
      branchName
      url
      description
      updatedAt
    }
  }
}
```

内部 id がわかったら issue を読む:

```graphql
query IssueDetails($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    url
    description
    state {
      id
      name
      type
    }
    project {
      id
      name
    }
    attachments {
      nodes {
        id
        title
        url
        sourceType
      }
    }
  }
}
```

### issue のチームのワークフロー状態をクエリする

issue 状態を変更する前に、正確な状態 ID／名前が必要なときに使う。

**MCP 経路:**

- `mcp__linear__get_issue` で `team` 情報を取得し、`mcp__linear__list_issue_statuses` にその `teamId` を渡してそのチームのワークフロー状態一覧を得る。
- 個別の状態を取りたい場合は `mcp__linear__get_issue_status`。

**`linear_graphql` フォールバック:**

```graphql
query IssueTeamStates($id: String!) {
  issue(id: $id) {
    id
    team {
      id
      key
      name
      states {
        nodes {
          id
          name
          type
        }
      }
    }
  }
}
```

### コメントを作成する

**MCP 経路:**

- `mcp__linear__save_comment` を使う。`issueId` と `body` を渡す。
- スレッドへの返信は `parentId` を指定する。
- 本文の改行はそのまま実改行で記述する（リテラル `\n` を書かない）。

**`linear_graphql` フォールバック:**

```graphql
mutation CreateComment($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment {
      id
      url
    }
  }
}
```

### 既存のコメントを編集する

**MCP 経路:**

- `mcp__linear__save_comment` に `id` を含めて呼ぶと既存コメントの更新になる（同じ "save" API で create/update を兼ねる）。

**`linear_graphql` フォールバック:**

```graphql
mutation UpdateComment($id: String!, $body: String!) {
  commentUpdate(id: $id, input: { body: $body }) {
    success
    comment {
      id
      body
    }
  }
}
```

### issue を別の状態に移動する

**MCP 経路:**

1. `mcp__linear__get_issue` でチームを特定する。
2. `mcp__linear__list_issue_statuses` で目的の状態 ID を取得する。
3. `mcp__linear__save_issue` に `id` と `stateId`（または対応するフィールド）を渡して更新する。

**`linear_graphql` フォールバック:**

```graphql
mutation MoveIssueToState($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) {
    success
    issue {
      id
      identifier
      state {
        id
        name
      }
    }
  }
}
```

### GitHub PR を issue にアタッチする

**MCP 経路:**

- `mcp__linear__create_attachment` に `issueId`、`url`、`title` を渡す。
- GitHub PR 用のリッチなプレビュー（PR の状態など）が必要で MCP がそれをサポートしない場合のみ、フォールバックの `attachmentLinkGitHubPR` を使う。

**`linear_graphql` フォールバック:**

GitHub 固有のリンクメタデータが欲しい場合:

```graphql
mutation AttachGitHubPR($issueId: String!, $url: String!, $title: String) {
  attachmentLinkGitHubPR(
    issueId: $issueId
    url: $url
    title: $title
    linkKind: links
  ) {
    success
    attachment {
      id
      title
      url
    }
  }
}
```

プレーンな URL アタッチメントで足りる場合:

```graphql
mutation AttachURL($issueId: String!, $url: String!, $title: String) {
  attachmentLinkURL(issueId: $issueId, url: $url, title: $title) {
    success
    attachment {
      id
      title
      url
    }
  }
}
```

### コメントに動画／ファイルをアップロードする

MCP には現状アップロード API がない。**`linear_graphql` 経路を使う**。

3 ステップで行う:

1. `linear_graphql` を `fileUpload` で呼び出して、`uploadUrl`、`assetUrl`、必要なアップロードヘッダーを取得する。
2. ローカルファイルのバイトを `curl -X PUT` と `fileUpload` から返された正確なヘッダーで `uploadUrl` にアップロードする。
3. 再び操作する: `mcp__linear__save_comment`（または `linear_graphql` の `commentCreate`／`commentUpdate`）を呼び、結果の `assetUrl` をコメント本文に埋め込む。

```graphql
mutation FileUpload(
  $filename: String!
  $contentType: String!
  $size: Int!
  $makePublic: Boolean
) {
  fileUpload(
    filename: $filename
    contentType: $contentType
    size: $size
    makePublic: $makePublic
  ) {
    success
    uploadFile {
      uploadUrl
      assetUrl
      headers {
        key
        value
      }
    }
  }
}
```

### 不慣れなオペレーション／スキーマの探索

MCP では露出していない mutation・input 型・object フィールドが必要なときは、`linear_graphql` 経由でターゲットされたイントロスペクションを使う。

mutation 名一覧:

```graphql
query ListMutations {
  __type(name: "Mutation") {
    fields {
      name
    }
  }
}
```

特定の input オブジェクトを調査:

```graphql
query CommentCreateInputShape {
  __type(name: "CommentCreateInput") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
}
```

```graphql
query QueryFields {
  __type(name: "Query") {
    fields {
      name
    }
  }
}
```

```graphql
query IssueFieldArgs {
  __type(name: "Query") {
    fields {
      name
      args {
        name
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
}
```

## 使用ルール

- 通常の CRUD（issue／コメント／プロジェクト／チーム／ステータス／添付）は MCP を優先する。
- アップロード、イントロスペクション、未対応の mutation には `linear_graphql` を使う。
- 既知の情報に合わせて最も狭い issue ルックアップを優先する: key -> identifier 検索 -> 内部 id。
- 状態遷移では、まずチームの状態を取得し、ID を文字列リテラルでハードコードしない。
- GitHub PR を Linear issue にリンクするときは、リッチなプレビューが必要なら `attachmentLinkGitHubPR` を、それ以外は MCP の `create_attachment` を優先する。
- GraphQL アクセス用の新しい raw-token シェルヘルパーを導入しない。
- アップロード用のシェル作業は `fileUpload` から返された署名済みアップロード URL にのみ使用する。これらの URL は既に必要な認可情報を持っている。
- MCP のツールに文字列を渡すときは、エスケープシーケンスを書かずそのまま渡す（実改行を含む markdown など）。
