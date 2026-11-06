// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MiraiStance } from "../../../shared/types";
import { MiraiStanceCard } from "./mirai-stance-card";

const stance: MiraiStance = {
  id: "1",
  bill_id: "bill-1",
  type: "for",
  comment: "賛成の理由",
  reason_summary: null,
  reason_points: [],
  supplements: [],
  is_published: true,
  publish_at: null,
  publish_review_date: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("MiraiStanceCard", () => {
  it("賛否と判断の理由を出す", () => {
    render(
      <MiraiStanceCard stance={stance} billStatus="in_originating_house" />
    );

    expect(screen.getByText("賛成")).toBeInTheDocument();
    expect(screen.getByText("賛成の理由")).toBeInTheDocument();
  });

  // 提出前に賛否を登録した後でステータスを戻した場合など。賛否の中身はまだ出さない。
  it("法案提出前は賛否の代わりに提出前の案内を出す", () => {
    render(<MiraiStanceCard stance={stance} billStatus="preparing" />);

    expect(screen.getByText("法案提出前")).toBeInTheDocument();
    expect(
      screen.getByText("法案提出後、党内で検討のうえ賛否を表明します。")
    ).toBeInTheDocument();
    expect(screen.queryByText("賛成")).not.toBeInTheDocument();
    expect(screen.queryByText("賛成の理由")).not.toBeInTheDocument();
  });

  it("判断の理由の下に関連する内容（動画など）を出す", () => {
    render(
      <MiraiStanceCard stance={stance} billStatus="in_originating_house">
        <p>関連動画</p>
      </MiraiStanceCard>
    );

    expect(screen.getByText("関連動画")).toBeInTheDocument();
  });

  it("法案提出前は関連する内容も出さない", () => {
    render(
      <MiraiStanceCard stance={stance} billStatus="preparing">
        <p>関連動画</p>
      </MiraiStanceCard>
    );

    expect(screen.queryByText("関連動画")).not.toBeInTheDocument();
  });
});
