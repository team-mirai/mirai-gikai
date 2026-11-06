import { describe, expect, it } from "vitest";
import type { FinalTopicWithId } from "../shared/types";
import {
  buildTopicHierarchy,
  OTHER_BIG_TOPIC_TITLE,
  sortHierarchyByOpinionCount,
} from "./build-topic-hierarchy";

const medium = (localId: string): FinalTopicWithId => ({
  local_id: localId,
  title: `${localId} の主張`,
  description: `${localId} の説明`,
});

const mediums = [medium("tA"), medium("tB"), medium("tC")];

describe("buildTopicHierarchy", () => {
  it("大トピック配下に中トピックを並べる", () => {
    const result = buildTopicHierarchy(
      [
        { title: "権限", description: "権限の話", member_local_ids: ["tA"] },
        {
          title: "予算",
          description: "予算の話",
          member_local_ids: ["tB", "tC"],
        },
      ],
      mediums
    );

    expect(result).toHaveLength(2);
    expect(result[0].big?.title).toBe("権限");
    expect(result[0].children.map((c) => c.local_id)).toEqual(["tA"]);
    expect(result[1].children.map((c) => c.local_id)).toEqual(["tB", "tC"]);
  });

  // 取りこぼすと中トピックごと表示から消え、意見も見えなくなる。
  it("一部でも大トピックが立てば、漏れはその他に集める", () => {
    const result = buildTopicHierarchy(
      [{ title: "権限", description: "権限の話", member_local_ids: ["tA"] }],
      mediums
    );

    const other = result.at(-1);
    expect(other?.big?.title).toBe(OTHER_BIG_TOPIC_TITLE);
    expect(other?.children.map((c) => c.local_id)).toEqual(["tB", "tC"]);
  });

  it("全部が割り当てられていればその他を作らない", () => {
    const result = buildTopicHierarchy(
      [
        {
          title: "全部",
          description: "まとめ",
          member_local_ids: ["tA", "tB", "tC"],
        },
      ],
      mediums
    );

    expect(result).toHaveLength(1);
    expect(result[0].big?.title).not.toBe(OTHER_BIG_TOPIC_TITLE);
  });

  // 重複すると同じ中トピックが2箇所に出て件数も二重計上される。
  it("同じ中トピックが複数の大トピックに現れたら最初だけ採用する", () => {
    const result = buildTopicHierarchy(
      [
        { title: "先", description: "-", member_local_ids: ["tA", "tB"] },
        { title: "後", description: "-", member_local_ids: ["tB", "tC"] },
      ],
      mediums
    );

    expect(result[0].children.map((c) => c.local_id)).toEqual(["tA", "tB"]);
    expect(result[1].children.map((c) => c.local_id)).toEqual(["tC"]);
  });

  it("存在しない local_id は捨てる", () => {
    const result = buildTopicHierarchy(
      [
        {
          title: "権限",
          description: "-",
          member_local_ids: ["tA", "tZZZ"],
        },
      ],
      mediums
    );

    expect(result[0].children.map((c) => c.local_id)).toEqual(["tA"]);
  });

  it("中トピックが残らない大トピックは落とす", () => {
    const result = buildTopicHierarchy(
      [
        { title: "空", description: "-", member_local_ids: ["tZZZ"] },
        { title: "権限", description: "-", member_local_ids: ["tA"] },
      ],
      mediums
    );

    expect(result.map((r) => r.big?.title)).toEqual([
      "権限",
      OTHER_BIG_TOPIC_TITLE,
    ]);
  });

  // グルーピングできなかったときに「その他の論点」1つにぶら下げると、
  // 2階層化前と同じ見え方にならない。親を作らずフラットに出す。
  it("大トピックが1つも立たなければ親を作らずフラットに返す", () => {
    const result = buildTopicHierarchy([], mediums);

    expect(result).toHaveLength(1);
    expect(result[0].big).toBeNull();
    expect(result[0].children).toHaveLength(3);
  });

  it("中トピックが無ければ空を返す", () => {
    expect(buildTopicHierarchy([], [])).toEqual([]);
  });
});

describe("sortHierarchyByOpinionCount", () => {
  const counts = new Map([
    ["tA", 5],
    ["tB", 30],
    ["tC", 10],
  ]);

  it("大トピックを配下の合計件数の降順にする", () => {
    const sorted = sortHierarchyByOpinionCount(
      [
        {
          big: { title: "少", description: "-" },
          children: [medium("tA")],
          isOther: false,
        },
        {
          big: { title: "多", description: "-" },
          children: [medium("tB")],
          isOther: false,
        },
      ],
      counts
    );

    expect(sorted.map((s) => s.big?.title)).toEqual(["多", "少"]);
  });

  it("大トピック内の中トピックも件数降順にする", () => {
    const sorted = sortHierarchyByOpinionCount(
      [
        {
          big: { title: "まとめ", description: "-" },
          children: [medium("tA"), medium("tB"), medium("tC")],
          isOther: false,
        },
      ],
      counts
    );

    expect(sorted[0].children.map((c) => c.local_id)).toEqual([
      "tB",
      "tC",
      "tA",
    ]);
  });

  // LLM が同名の大トピックを返しても巻き添えにしないよう、判定はフラグで行う。
  it("同名でもフラグが false なら末尾送りしない", () => {
    const sorted = sortHierarchyByOpinionCount(
      [
        {
          big: { title: OTHER_BIG_TOPIC_TITLE, description: "-" },
          children: [medium("tB")],
          isOther: false,
        },
        {
          big: { title: "権限", description: "-" },
          children: [medium("tA")],
          isOther: false,
        },
      ],
      counts
    );
    expect(sorted[0].big?.title).toBe(OTHER_BIG_TOPIC_TITLE);
  });

  // 読み手が最後に見るものなので件数によらず末尾に固定する。
  it("その他は件数が多くても末尾に置く", () => {
    const sorted = sortHierarchyByOpinionCount(
      [
        {
          big: { title: OTHER_BIG_TOPIC_TITLE, description: "-" },
          children: [medium("tB")],
          isOther: true,
        },
        {
          big: { title: "権限", description: "-" },
          children: [medium("tA")],
          isOther: false,
        },
      ],
      counts
    );

    expect(sorted.map((s) => s.big?.title)).toEqual([
      "権限",
      OTHER_BIG_TOPIC_TITLE,
    ]);
  });

  it("件数が無い中トピックは0として扱う", () => {
    const sorted = sortHierarchyByOpinionCount(
      [
        {
          big: { title: "まとめ", description: "-" },
          children: [medium("tUnknown"), medium("tA")],
          isOther: false,
        },
      ],
      counts
    );

    expect(sorted[0].children.map((c) => c.local_id)).toEqual([
      "tA",
      "tUnknown",
    ]);
  });
});
